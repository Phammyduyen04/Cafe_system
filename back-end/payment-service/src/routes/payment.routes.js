const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// =============================================
// PUBLIC: MoMo IPN callback (không cần auth)
// Phải đặt TRƯỚC router.use(authMiddleware)
// =============================================
router.post('/momo/ipn', paymentController.handleMomoIPN);

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
router.get('/', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF'), paymentController.getAllPayments);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);
router.get('/:id', paymentController.getPaymentById);

// =============================================
// CASH: Nhân viên xác nhận thu tiền mặt
// =============================================
router.post('/:id/cash-confirm', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF'), paymentController.confirmCashPayment);

// =============================================
// QR: Nhân viên xác nhận nhận được chuyển khoản
// =============================================
router.post('/:id/qr-confirm', authorizeMiddleware('ADMIN', 'MANAGER', 'STAFF'), paymentController.confirmQRPayment);

module.exports = router;
