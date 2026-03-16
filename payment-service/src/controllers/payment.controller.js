const paymentService = require('../services/payment.service');
const { responseHelper } = require('shared');

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

const createSession = async (req, res, next) => {
  try {
    const session = await paymentService.createSession(req.params.id, req.body, req.user);
    return responseHelper.created(res, session, 'Payment session created');
  } catch (error) {
    next(error);
  }
};

const processTransaction = async (req, res, next) => {
  try {
    const transaction = await paymentService.processTransaction(req.params.sessionId, req.body);
    return responseHelper.created(res, transaction, 'Transaction processed');
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  createSession,
  processTransaction,
  getPaymentMethods,
  createPaymentMethod,
};
