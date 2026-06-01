const { AppError, publisher } = require('../../../shared');
const paymentRepo = require('../repositories/payment.repo');
const momoService = require('./momo.service');
const vietQRService = require('./vietqr.service');
const vnpayService = require('./vnpay.service');
const crypto = require('crypto');

const generateCode = (prefix) => {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * Publish sự kiện payment.completed để order-service cập nhật trạng thái đơn hàng → PAID
 */
const publishPaymentCompleted = async (orderId, paymentMethod) => {
  try {
    await publisher.publish('payment_exchange', 'payment.completed', {
      orderId,
      paymentMethod,
    });
  } catch (err) {
    console.error(`[payment-service] Failed to publish payment.completed for order ${orderId}: ${err.message}`);
  }
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

  if (method === 'VNPAY') {
    const payUrl = vnpayService.createPaymentUrl({
      amount: Math.round(Number(totalAmount)),
      orderCode,
      orderInfo: `Thanh toan don hang ${orderCode}`,
    });

    const payment = await paymentRepo.createPayment({
      order_id: orderId,
      total_amount: totalAmount,
      remaining_amount: totalAmount,
      payment_method: 'VNPAY',
      payment_url: payUrl,
      provider_order_id: orderCode,
    });

    return { payment, payUrl };
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

  const completed = await paymentRepo.updatePayment(paymentId, {
    paid_amount: totalAmount,
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });
  await publishPaymentCompleted(payment.order_id, 'CASH');
  return completed;
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

  const completedQR = await paymentRepo.updatePayment(paymentId, {
    paid_amount: Number(payment.total_amount),
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });
  await publishPaymentCompleted(payment.order_id, 'QR');
  return completedQR;
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

  await publishPaymentCompleted(payment.order_id, 'MOMO');
  return { success: true };
};

// =============================================
// VNPAY: Xử lý IPN callback từ VNPay
// =============================================

/**
 * VNPay gọi endpoint này sau khi giao dịch hoàn tất.
 * Phải trả về { RspCode: "00", Message: "Confirm Success" } để VNPay không retry.
 */
const handleVnpayIPN = async (query) => {
  const isValid = vnpayService.verifyCallback(query);
  if (!isValid) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const orderCode      = query.vnp_TxnRef;
  const responseCode   = query.vnp_ResponseCode;
  const transactionNo  = query.vnp_TransactionNo;
  const vnpAmount      = Number(query.vnp_Amount) / 100; // VNPay gửi amount * 100

  const payment = await paymentRepo.findByProviderOrderId(orderCode);
  if (!payment) return { RspCode: '01', Message: 'Order Not Found' };
  if (payment.payment_status === 'COMPLETED') return { RspCode: '02', Message: 'Order Already Confirmed' };

  // Kiểm tra số tiền
  if (Math.abs(vnpAmount - Number(payment.total_amount)) > 1) {
    return { RspCode: '04', Message: 'Invalid Amount' };
  }

  if (responseCode !== '00') {
    // Giao dịch thất bại — ghi log, không cập nhật
    console.warn(`[vnpay-ipn] Payment failed: orderCode=${orderCode}, code=${responseCode}`);
    return { RspCode: '00', Message: 'Confirm Success' }; // vẫn trả 00 để VNPay biết ta đã nhận
  }

  const vnpayMethod = await paymentRepo.findMethodByCode('BANK_TRANSFER');

  const session = await paymentRepo.createSession({
    payment_id: payment.payment_id,
    session_code: generateCode('SS'),
    expired_at: new Date(),
    session_status: 'COMPLETED',
    ended_at: new Date(),
  });

  await paymentRepo.createTransaction({
    payment_session_id: session.payment_session_id,
    payment_method_id: vnpayMethod ? vnpayMethod.payment_method_id : null,
    transaction_code: generateCode('TXN'),
    amount: Number(payment.total_amount),
    transaction_status: 'SUCCESS',
    gateway_response: JSON.stringify({ transactionNo, responseCode }),
    note: `VNPay transNo: ${transactionNo}`,
    paid_at: new Date(),
  });

  await paymentRepo.updatePayment(payment.payment_id, {
    paid_amount: Number(payment.total_amount),
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });

  await publishPaymentCompleted(payment.order_id, 'VNPAY');
  return { RspCode: '00', Message: 'Confirm Success' };
};

// =============================================
// MOCK WEBHOOK: Giả lập ngân hàng báo thanh toán thành công
// Chỉ dùng trong môi trường dev/demo — thay bằng PayOS/Sepay webhook ở production
// =============================================

/**
 * Giả lập callback từ ngân hàng/payment gateway xác nhận giao dịch QR thành công.
 * Payload giống chuẩn PayOS: { orderCode, amount, transactionId }
 */
const handleMockBankWebhook = async ({ orderId, amount, transactionId }) => {
  if (!orderId) throw new AppError('orderId là bắt buộc', 400);

  const payment = await paymentRepo.findByOrderId(orderId);
  if (!payment) throw new AppError('Không tìm thấy payment cho đơn hàng này', 404);
  if (payment.payment_method !== 'QR') throw new AppError('Đơn hàng này không dùng thanh toán QR', 400);
  if (payment.payment_status === 'COMPLETED') return payment; // idempotent — bank có thể gọi nhiều lần

  // Kiểm tra số tiền khớp (nới lỏng ±1đ vì làm tròn)
  if (amount !== undefined && Math.abs(Number(amount) - Number(payment.total_amount)) > 1) {
    throw new AppError(`Số tiền không khớp: nhận ${amount}, cần ${payment.total_amount}`, 400);
  }

  const qrMethod = await paymentRepo.findMethodByCode('BANK_TRANSFER');

  const session = await paymentRepo.createSession({
    payment_id: payment.payment_id,
    session_code: generateCode('SS'),
    expired_at: new Date(Date.now() + 5 * 60 * 1000),
    session_status: 'COMPLETED',
    ended_at: new Date(),
  });

  await paymentRepo.createTransaction({
    payment_session_id: session.payment_session_id,
    payment_method_id: qrMethod ? qrMethod.payment_method_id : null,
    transaction_code: transactionId ?? generateCode('TXN'),
    amount: Number(payment.total_amount),
    transaction_status: 'SUCCESS',
    gateway_response: JSON.stringify({ source: 'mock_bank_webhook', transactionId }),
    note: `[MOCK] Ngân hàng xác nhận giao dịch: ${transactionId ?? 'N/A'}`,
    paid_at: new Date(),
  });

  const completed = await paymentRepo.updatePayment(payment.payment_id, {
    paid_amount: Number(payment.total_amount),
    remaining_amount: 0,
    payment_status: 'COMPLETED',
  });

  await publishPaymentCompleted(payment.order_id, 'QR');
  return completed;
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
  handleVnpayIPN,
  handleMockBankWebhook,
  handleMomoCallback,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentMethods,
  createPaymentMethod,
};
