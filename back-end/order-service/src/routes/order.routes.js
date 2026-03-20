const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.post('/', authorizeMiddleware('MANAGER', 'EMPLOYEE', 'CUSTOMER'), orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', authorizeMiddleware('MANAGER', 'EMPLOYEE'), orderController.updateOrderStatus);
router.get('/:id/status-logs', orderController.getOrderStatusLogs);

module.exports = router;
