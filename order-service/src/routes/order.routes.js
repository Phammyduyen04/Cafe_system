const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware, authorizeMiddleware } = require('shared');

router.use(authMiddleware);

router.post('/', authorizeMiddleware('ADMIN', 'MANAGER', 'CASHIER'), orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', authorizeMiddleware('ADMIN', 'MANAGER', 'CASHIER', 'BARISTA'), orderController.updateOrderStatus);
router.get('/:id/status-logs', orderController.getOrderStatusLogs);

module.exports = router;
