const { AppError } = require('../../../shared');
const paymentRepo = require('../repositories/payment.repo');
const crypto = require('crypto');

const generateCode = (prefix) => {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

/**
 * Tạo payment record khi nhận event order.created
 */
const createPaymentFromOrder = async (orderId, totalAmount) => {
  const existing = await paymentRepo.findByOrderId(orderId);
  if (existing) return existing;

  return await paymentRepo.createPayment({
    order_id: orderId,
    total_amount: totalAmount,
    remaining_amount: totalAmount,
  });
};

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

/**
 * Tạo phiên thanh toán
 */
const createSession = async (paymentId, data, user) => {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.payment_status === 'COMPLETED') throw new AppError('Payment already completed', 400);

  const expiredAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

  return await paymentRepo.createSession({
    payment_id: paymentId,
    session_code: generateCode('SS'),
    expired_at: expiredAt,
    initiated_by: user.username,
    device_info: data.deviceInfo || null,
    note: data.note || null,
  });
};

/**
 * Xử lý giao dịch thanh toán
 */
const processTransaction = async (sessionId, data) => {
  const session = await paymentRepo.findSessionById(sessionId);
  if (!session) throw new AppError('Session not found', 404);
  if (session.session_status !== 'ACTIVE') throw new AppError('Session is not active', 400);
  if (new Date() > session.expired_at) throw new AppError('Session has expired', 400);

  const { paymentMethodId, amount } = data;
  if (!paymentMethodId || !amount) throw new AppError('Payment method and amount are required', 400);

  const transaction = await paymentRepo.createTransaction({
    payment_session_id: sessionId,
    payment_method_id: paymentMethodId,
    transaction_code: generateCode('TXN'),
    amount,
    transaction_status: 'SUCCESS',
    paid_at: new Date(),
  });

  // Update payment amounts
  const payment = await paymentRepo.findById(session.payment_id);
  const newPaidAmount = Number(payment.paid_amount) + Number(amount);
  const newRemaining = Number(payment.total_amount) - newPaidAmount;

  await paymentRepo.updatePayment(payment.payment_id, {
    paid_amount: newPaidAmount,
    remaining_amount: newRemaining > 0 ? newRemaining : 0,
    payment_status: newRemaining <= 0 ? 'COMPLETED' : 'PARTIAL',
  });

  // End session if payment completed
  if (newRemaining <= 0) {
    await paymentRepo.updateSession(sessionId, {
      session_status: 'COMPLETED',
      ended_at: new Date(),
    });
  }

  return transaction;
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
  createPaymentFromOrder,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  createSession,
  processTransaction,
  getPaymentMethods,
  createPaymentMethod,
};
