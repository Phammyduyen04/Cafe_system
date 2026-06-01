const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// =============================================
// PUBLIC: Callbacks không cần auth (đặt TRƯỚC authMiddleware)
// =============================================
router.post('/momo/ipn',    paymentController.handleMomoIPN);
router.get('/vnpay/ipn',   paymentController.handleVnpayIPN);
// Mock webhook giả lập ngân hàng — chỉ dùng dev/demo, xóa khi lên production
router.post('/webhook/mock', paymentController.handleMockBankWebhook);

// Tất cả routes bên dưới đều yêu cầu xác thực
router.use(authMiddleware);

// =============================================
// PAYMENT METHODS
// =============================================
router.get('/methods', paymentController.getPaymentMethods);
router.post('/methods', authorizeMiddleware('ADMIN', 'MANAGER'), paymentController.createPaymentMethod);

// =============================================
// INITIATE (gọi từ order-service)
// =============================================
router.post('/initiate', paymentController.initiatePayment);

// =============================================
// PAYMENTS
// =============================================
router.get('/', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF', 'EMPLOYEE'), paymentController.getAllPayments);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);
router.get('/:id', paymentController.getPaymentById);

// =============================================
// CASH: Nhân viên xác nhận thu tiền mặt
// =============================================
router.post('/:id/cash-confirm', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF', 'EMPLOYEE'), paymentController.confirmCashPayment);

// =============================================
// QR: Nhân viên xác nhận nhận được chuyển khoản
// =============================================
router.post('/:id/qr-confirm', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF', 'EMPLOYEE'), paymentController.confirmQRPayment);


module.exports = router;
