const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

// Payment methods
router.get('/methods', paymentController.getPaymentMethods);
router.post('/methods', authorizeMiddleware('ADMIN', 'MANAGER'), paymentController.createPaymentMethod);

// Payments
router.get('/', authorizeMiddleware('MANAGER', 'EMPLOYEE', 'CUSTOMER'), paymentController.getAllPayments);
router.get('/:id', paymentController.getPaymentById);
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

// Sessions
router.post('/:id/sessions', authorizeMiddleware('MANAGER', 'EMPLOYEE', 'CUSTOMER'), paymentController.createSession);

// Transactions
router.post('/sessions/:sessionId/transactions', authorizeMiddleware('MANAGER', 'EMPLOYEE', 'CUSTOMER'), paymentController.processTransaction);

module.exports = router;
