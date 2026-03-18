const orderService = require('../services/order.service');
const { responseHelper } = require('../../../shared');

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    return responseHelper.created(res, order, 'Order created successfully');
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, customerId } = req.query;
    const result = await orderService.getAllOrders(parseInt(page), parseInt(limit), { status, customerId: customerId || undefined });
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

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status, req.user, note);
    return responseHelper.success(res, order, 'Order status updated successfully');
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

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, getOrderStatusLogs };
