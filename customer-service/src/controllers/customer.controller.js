const customerService = require('../services/customer.service');
const { responseHelper } = require('shared');

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return responseHelper.created(res, customer, 'Customer created successfully');
  } catch (error) {
    next(error);
  }
};

const getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const result = await customerService.getAllCustomers(parseInt(page), parseInt(limit), search);
    return responseHelper.paginated(res, result.customers, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return responseHelper.success(res, customer);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return responseHelper.success(res, customer, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    return responseHelper.success(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getCustomerPoints = async (req, res, next) => {
  try {
    const points = await customerService.getCustomerPoints(req.params.id);
    return responseHelper.success(res, { points });
  } catch (error) {
    next(error);
  }
};

const getCustomerPointLogs = async (req, res, next) => {
  try {
    const logs = await customerService.getCustomerPointLogs(req.params.id);
    return responseHelper.success(res, logs);
  } catch (error) {
    next(error);
  }
};

const adjustPoints = async (req, res, next) => {
  try {
    const { points, reason } = req.body;
    const result = await customerService.addPoints(
      req.params.id,
      points,
      'ADJUST',
      reason || 'Manual adjustment'
    );
    return responseHelper.success(res, result, 'Points adjusted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerPoints,
  getCustomerPointLogs,
  adjustPoints,
};
