const { AppError } = require('../../../shared');
const paymentRepo = require('../repositories/payment.repo');
const momoService = require('./momo.service');
const vietQRService = require('./vietqr.service');
const crypto = require('crypto');

const generateCode = (prefix) => {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

// =============================================
// CORE: Khởi tạo thanh toán khi đặt đơn
// Được gọi từ order-service qua HTTP
// =============================================

/**
 * Khởi tạo payment theo phương thức được chọn.
 * - MOMO: Gọi MoMo API, trả về payUrl
 * - QR  : Tạo VietQR URL, trả về qrUrl
 * - CASH: Tạo payment PENDING, nhân viên xác nhận sau
 */
const initiatePayment = async (orderId, totalAmount, paymentMethod, orderCode) => {
  const existing = await paymentRepo.findByOrderId(orderId);
  if (existing) return { payment: existing };

  const method = (paymentMethod || 'CASH').toUpperCase();

  if (method === 'MOMO') {
    const momoOrderId = generateCode('MOMO');
    const orderInfo = `Thanh toan don hang ${orderCode}`;

    const momoResult = await momoService.createMomoPayment({
      momoOrderId,
      amount: Math.round(Number(totalAmount)),
      orderInfo,
      requestId: momoOrderId,
    });

    if (momoResult.resultCode !== 0) {
      throw new AppError(`MoMo: ${momoResult.message}`, 400);
    }

    const payment = await paymentRepo.createPayment({
      order_id: orderId,
      total_amount: totalAmount,
      remaining_amount: totalAmount,
      payment_method: 'MOMO',
      payment_url: momoResult.payUrl,
      provider_order_id: momoOrderId,
    });

    return {
      payment,
      payUrl: momoResult.payUrl,
      deeplink: momoResult.deeplink || null,
      qrCodeUrl: momoResult.qrCodeUrl || null,
    };
  }

  if (method === 'QR') {
    const qrUrl = vietQRService.generateVietQRUrl({
      amount: Math.round(Number(totalAmount)),
      orderCode,
    });

    const payment = await paymentRepo.createPayment({
      order_id: orderId,
      total_amount: totalAmount,
      remaining_amount: totalAmount,
      payment_method: 'QR',
      payment_url: qrUrl,
    });

    return { payment, qrUrl };
  }

  // CASH
  const payment = await paymentRepo.createPayment({
    order_id: orderId,
    total_amount: totalAmount,
    remaining_amount: totalAmount,
    payment_method: 'CASH',
  });

  return { payment };
};

/**
 * Fallback: tạo payment từ RabbitMQ event (không có paymentMethod thì mặc định CASH)
 * Không gọi provider vì không sync được URL trở về
 */
const createPaymentFromOrder = async (orderId, totalAmount, paymentMethod) => {
  const existing = await paymentRepo.findByOrderId(orderId);
  if (existing) return existing;

  return await paymentRepo.createPayment({
    order_id: orderId,
    total_amount: totalAmount,
    remaining_amount: totalAmount,
    payment_method: (paymentMethod || 'CASH').toUpperCase(),
  });
};

// =============================================
// CASH: Nhân viên xác nhận thu tiền mặt
// =============================================

/**
 * Nhân viên nhập số tiền nhận được và tiền thừa để hoàn tất đơn tiền mặt.
 * @param {string} paymentId
 * @param {number} amountReceived - Số tiền khách đưa
 * @param {number} change         - Tiền thừa trả lại
 */
const confirmCashPayment = async (paymentId, amountReceived, change) => {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.payment_method !== 'CASH') throw new AppError('This payment is not a cash payment', 400);
  if (payment.payment_status === 'COMPLETED') throw new AppError('Payment already completed', 400);

  const totalAmount = Number(payment.total_amount);
  const received = Number(amountReceived);
  const changeAmount = Number(change);

  if (received < totalAmount) {
    throw new AppError(`Amount received (${received}) is less than total amount (${totalAmount})`, 400);
  }

  const expectedChange = received - totalAmount;
  if (Math.abs(changeAmount - expectedChange) > 1) {
    throw new AppError(`Change should be ${expectedChange} (received ${received} - total ${totalAmount})`, 400);
  }

  // Tìm payment method CASH
  const cashMethod = await paymentRepo.findMethodByCode('CASH');
  if (!cashMethod) throw new AppError('CASH payment method not configured. Please create it first.', 500);

  // Tạo session và transaction cho audit trail
  const session = await paymentRepo.createSession({
    payment_id: paymentId,
    session_code: generateCode('SS'),
    expired_at: new Date(Date.now() + 5 * 60 * 1000),
    session_status: 'COMPLETED',
    ended_at: new Date(),
  });

  await paymentRepo.createTransaction({
    payment_session_id: session.payment_session_id,
    payment_method_id: cashMethod.payment_method_id,
    transaction_code: generateCode('TXN'),
    amount: totalAmount,
    transaction_status: 'SUCCESS',
    note: `Thu: ${received} | Thoi: ${changeAmount}`,
    paid_at: new Date(),
  });

  return await paymentRepo.updatePayment(paymentId, {
    paid_amount: totalAmount,
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });
};

// =============================================
// QR: Nhân viên xác nhận đã nhận chuyển khoản
// =============================================

/**
 * Nhân viên xác nhận đã nhận tiền chuyển khoản QR
 */
const confirmQRPayment = async (paymentId, user) => {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.payment_method !== 'QR') throw new AppError('This payment is not a QR payment', 400);
  if (payment.payment_status === 'COMPLETED') throw new AppError('Payment already completed', 400);

  const qrMethod = await paymentRepo.findMethodByCode('BANK_TRANSFER');
  if (!qrMethod) throw new AppError('BANK_TRANSFER payment method not configured. Please create it first.', 500);

  const session = await paymentRepo.createSession({
    payment_id: paymentId,
    session_code: generateCode('SS'),
    expired_at: new Date(Date.now() + 5 * 60 * 1000),
    initiated_by: user.username,
    session_status: 'COMPLETED',
    ended_at: new Date(),
  });

  await paymentRepo.createTransaction({
    payment_session_id: session.payment_session_id,
    payment_method_id: qrMethod.payment_method_id,
    transaction_code: generateCode('TXN'),
    amount: Number(payment.total_amount),
    transaction_status: 'SUCCESS',
    note: `Xac nhan boi: ${user.username}`,
    paid_at: new Date(),
  });

  return await paymentRepo.updatePayment(paymentId, {
    paid_amount: Number(payment.total_amount),
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });
};

// =============================================
// MOMO: Xử lý IPN callback từ MoMo
// =============================================

/**
 * Xử lý IPN (Instant Payment Notification) từ MoMo
 * MoMo gọi endpoint này sau khi thanh toán thành công/thất bại
 */
const handleMomoCallback = async (data) => {
  const isValid = momoService.verifyMomoCallback(data);
  if (!isValid) throw new AppError('Invalid MoMo signature', 400);

  if (data.resultCode !== 0) {
    // Thanh toán thất bại - ghi log nhưng không throw lỗi (trả 200 cho MoMo)
    console.warn(`MoMo payment failed: orderId=${data.orderId}, code=${data.resultCode}, msg=${data.message}`);
    return { success: false, resultCode: data.resultCode, message: data.message };
  }

  const payment = await paymentRepo.findByProviderOrderId(data.orderId);
  if (!payment) {
    console.error(`MoMo IPN: payment not found for orderId=${data.orderId}`);
    return { success: false, message: 'Payment not found' };
  }

  if (payment.payment_status === 'COMPLETED') {
    return { success: true, message: 'Already completed' };
  }

  const momoMethod = await paymentRepo.findMethodByCode('MOMO');

  // Tạo session + transaction cho audit trail
  const session = await paymentRepo.createSession({
    payment_id: payment.payment_id,
    session_code: generateCode('SS'),
    expired_at: new Date(),
    session_status: 'COMPLETED',
    ended_at: new Date(),
  });

  await paymentRepo.createTransaction({
    payment_session_id: session.payment_session_id,
    payment_method_id: momoMethod ? momoMethod.payment_method_id : null,
    transaction_code: generateCode('TXN'),
    amount: Number(payment.total_amount),
    transaction_status: 'SUCCESS',
    gateway_response: JSON.stringify({ transId: data.transId, payType: data.payType }),
    note: `MoMo transId: ${data.transId}`,
    paid_at: new Date(),
  });

  await paymentRepo.updatePayment(payment.payment_id, {
    paid_amount: Number(payment.total_amount),
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });

  return { success: true };
};

// =============================================
// QUERIES
// =============================================

const getAllPayments = async (page, limit, status) => {
  const skip = (page - 1) * limit;
  const where = status ? { payment_status: status } : {};

  const [payments, total] = await Promise.all([
    paymentRepo.findMany(where, skip, limit),
    paymentRepo.count(where),
  ]);

  return {
    payments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getPaymentById = async (id) => {
  const payment = await paymentRepo.findById(id);
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
};

const getPaymentByOrderId = async (orderId) => {
  const payment = await paymentRepo.findByOrderId(orderId);
  if (!payment) throw new AppError('Payment not found for this order', 404);
  return payment;
};

const getPaymentMethods = async () => {
  return await paymentRepo.findAllMethods();
};

const createPaymentMethod = async (data) => {
  const { methodCode, methodName, description } = data;
  if (!methodCode || !methodName) throw new AppError('Method code and name are required', 400);

  return await paymentRepo.createMethod({
    method_code: methodCode,
    method_name: methodName,
    description: description || null,
  });
};

module.exports = {
  initiatePayment,
  createPaymentFromOrder,
  confirmCashPayment,
  confirmQRPayment,
  handleMomoCallback,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentMethods,
  createPaymentMethod,
};
