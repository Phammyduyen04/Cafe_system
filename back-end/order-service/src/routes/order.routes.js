const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const cartController = require('../controllers/cart.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

// =============================================
// CUSTOMER ROUTES (Khách hàng đặt đơn online)
// =============================================

// Giỏ hàng
router.get('/cart', cartController.getCart);
router.post('/cart/items', cartController.addToCart);
router.put('/cart/items/:itemId', cartController.updateCartItem);
router.delete('/cart/items/:itemId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

// Đặt đơn từ giỏ hàng (khách hàng online)
router.post('/checkout', orderController.createOrderFromCart);

// Đơn hàng của tôi
router.get('/my-orders', orderController.getMyOrders);

// Khách hàng hủy đơn
router.put('/my-orders/:id/cancel', orderController.cancelMyOrder);

// =============================================
// STAFF ROUTES (Nhân viên tạo đơn tại quầy)
// =============================================

// Tạo đơn tại quầy (nhân viên)
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.createOrder);

// Xem tất cả đơn hàng (filter theo status, customerId, orderChannel)
router.get('/', orderController.getAllOrders);

// Xem chi tiết đơn hàng
router.get('/:id', orderController.getOrderById);

// Cập nhật trạng thái đơn (nhân viên tiếp nhận, pha chế, hoàn thành, hủy)
router.put('/:id/status', authorizeMiddleware('ADMIN', 'MANAGER', 'EMPLOYEE'), orderController.updateOrderStatus);

// Xem lịch sử trạng thái đơn
router.get('/:id/status-logs', orderController.getOrderStatusLogs);

module.exports = router;