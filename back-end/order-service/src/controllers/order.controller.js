const orderService = require('../services/order.service');
const { responseHelper } = require('../../../shared');

/**
 * Tạo đơn hàng (nhân viên tại quầy hoặc khách hàng online truyền items trực tiếp)
 */
const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user, req.headers.authorization);
    return responseHelper.created(res, order, 'Tạo đơn thành công!');
  } catch (error) {
    next(error);
  }
};

/**
 * Khách hàng đặt đơn online từ giỏ hàng
 */
const createOrderFromCart = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(req.body, req.user, req.headers.authorization);
    return responseHelper.created(res, order, 'Tạo đơn thành công!');
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy tất cả đơn hàng (nhân viên)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, customerId, orderChannel } = req.query;
    const result = await orderService.getAllOrders(parseInt(page), parseInt(limit), {
      status,
      customerId: customerId || undefined,
      orderChannel: orderChannel || undefined,
    });
    return responseHelper.paginated(res, result.orders, result.pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách đơn hàng của khách hàng (chỉ đơn của chính họ)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const customerId = req.user.userId || req.user.accountId;
    const result = await orderService.getMyOrders(customerId, parseInt(page), parseInt(limit));
    return responseHelper.paginated(res, result.orders, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return responseHelper.success(res, order);
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật trạng thái đơn hàng (nhân viên)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user, note);
    return responseHelper.success(res, order, 'Order status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Khách hàng hủy đơn hàng online
 */
const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelMyOrder(req.params.id, req.user);
    return responseHelper.success(res, order, 'Đơn hàng đã được hủy');
  } catch (error) {
    next(error);
  }
};

const getOrderStatusLogs = async (req, res, next) => {
  try {
    const logs = await orderService.getOrderStatusLogs(req.params.id);
    return responseHelper.success(res, logs);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
  getOrderStatusLogs,
};