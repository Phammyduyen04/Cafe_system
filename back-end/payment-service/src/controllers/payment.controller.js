const paymentService = require('../services/payment.service');
const { responseHelper } = require('../../../shared');

// =============================================
// QUERIES
// =============================================

const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await paymentService.getAllPayments(parseInt(page), parseInt(limit), status);
    return responseHelper.paginated(res, result.payments, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    return responseHelper.success(res, payment);
  } catch (error) {
    next(error);
  }
};

const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrderId(req.params.orderId);
    return responseHelper.success(res, payment);
  } catch (error) {
    next(error);
  }
};

// =============================================
// PAYMENT METHODS
// =============================================

const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await paymentService.getPaymentMethods();
    return responseHelper.success(res, methods);
  } catch (error) {
    next(error);
  }
};

const createPaymentMethod = async (req, res, next) => {
  try {
    const method = await paymentService.createPaymentMethod(req.body);
    return responseHelper.created(res, method, 'Payment method created');
  } catch (error) {
    next(error);
  }
};

// =============================================
// INITIATE: Gọi từ order-service khi tạo đơn
// =============================================

/**
 * POST /api/payments/initiate
 * Body: { orderId, totalAmount, paymentMethod, orderCode }
 * Response: { payment, payUrl?, qrUrl?, deeplink?, qrCodeUrl? }
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { orderId, totalAmount, paymentMethod, orderCode } = req.body;
    if (!orderId || !totalAmount) {
      return next(new (require('../../../shared').AppError)('orderId and totalAmount are required', 400));
    }
    const result = await paymentService.initiatePayment(orderId, totalAmount, paymentMethod, orderCode);
    return responseHelper.created(res, result, 'Payment initiated');
  } catch (error) {
    next(error);
  }
};

// =============================================
// RETRY: Khách hàng tạo lại link thanh toán
// =============================================

const retryPayment = async (req, res, next) => {
  try {
    const result = await paymentService.retryPayment(req.params.orderId);
    return responseHelper.success(res, result, 'Payment URL created');
  } catch (error) {
    next(error);
  }
};

// =============================================
// CASH: Nhân viên xác nhận thu tiền mặt
// =============================================

/**
 * POST /api/payments/:id/cash-confirm
 * Body: { amountReceived, change }
 */
const confirmCashPayment = async (req, res, next) => {
  try {
    const { amountReceived, change } = req.body;
    if (amountReceived === undefined || change === undefined) {
      return next(new (require('../../../shared').AppError)('amountReceived and change are required', 400));
    }
    const payment = await paymentService.confirmCashPayment(req.params.id, amountReceived, change);
    return responseHelper.success(res, payment, 'Cash payment confirmed');
  } catch (error) {
    next(error);
  }
};

// =============================================
// QR: Nhân viên xác nhận đã nhận chuyển khoản
// =============================================

/**
 * POST /api/payments/:id/qr-confirm
 */
const confirmQRPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.confirmQRPayment(req.params.id, req.user);
    return responseHelper.success(res, payment, 'QR payment confirmed');
  } catch (error) {
    next(error);
  }
};

// =============================================
// VNPAY IPN: Callback từ VNPay (không cần auth)
// =============================================

/**
 * GET /api/payments/vnpay/ipn?vnp_TxnRef=...&vnp_ResponseCode=00&...
 * VNPay yêu cầu luôn trả về { RspCode: "00", Message: "Confirm Success" }
 */
const handleVnpayIPN = async (req, res, next) => {
  try {
    const result = await paymentService.handleVnpayIPN(req.query);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[vnpay-ipn] Error:', error.message);
    return res.status(200).json({ RspCode: '99', Message: error.message });
  }
};

// =============================================
// MOCK WEBHOOK: Giả lập ngân hàng báo thanh toán thành công (chỉ dùng dev/demo)
// =============================================

/**
 * POST /api/payments/webhook/mock
 * Body: { orderId, amount, transactionId }
 * Không cần auth — giả lập lời gọi từ bank/gateway bên ngoài (giống MoMo IPN)
 */
const handleMockBankWebhook = async (req, res, next) => {
  try {
    const { orderId, amount, transactionId } = req.body;
    const payment = await paymentService.handleMockBankWebhook({ orderId, amount, transactionId });
    return res.status(200).json({ success: true, message: 'Webhook xử lý thành công', data: payment });
  } catch (error) {
    // Trả 200 để client không retry (giống chuẩn webhook thực tế)
    console.error('[mock-webhook] Error:', error.message);
    return res.status(200).json({ success: false, message: error.message });
  }
};

// =============================================
// MOMO IPN: Callback từ MoMo (không cần auth)
// =============================================

/**
 * POST /api/payments/momo/ipn
 * MoMo gọi endpoint này sau khi thanh toán xong
 * Phải trả về HTTP 200 để MoMo không retry
 */
const handleMomoIPN = async (req, res, next) => {
  try {
    const result = await paymentService.handleMomoCallback(req.body);
    // MoMo yêu cầu luôn trả 200 với format cụ thể
    return res.status(200).json({
      partnerCode: req.body.partnerCode,
      requestId: req.body.requestId,
      orderId: req.body.orderId,
      resultCode: 0,
      message: 'success',
      responseTime: Date.now(),
      extraData: '',
      signature: '',
    });
  } catch (error) {
    // Vẫn trả 200 để MoMo không retry, nhưng log lỗi
    console.error('MoMo IPN error:', error.message);
    return res.status(200).json({ resultCode: 99, message: error.message });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  getPaymentMethods,
  createPaymentMethod,
  initiatePayment,
  retryPayment,
  confirmCashPayment,
  confirmQRPayment,
  handleVnpayIPN,
  handleMockBankWebhook,
  handleMomoIPN,
};
