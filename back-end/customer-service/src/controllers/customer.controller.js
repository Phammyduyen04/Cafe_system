const customerService = require('../services/customer.service');
const { responseHelper } = require('../../../shared');

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

const updateOwnProfile = async (req, res, next) => {
  try {
    const customer = await customerService.updateOwnProfile(req.user.accountId, req.body);
    return responseHelper.success(res, customer, 'Profile updated successfully');
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
    if (points === undefined || points === null) {
      return next(new Error('points is required'));
    }
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

const redeemPoints = async (req, res, next) => {
  try {
    const { points, reason } = req.body;
    const result = await customerService.redeemPoints(req.params.id, points, reason);
    return responseHelper.success(res, result, 'Points redeemed successfully');
  } catch (error) {
    next(error);
  }
};

const getCustomerByAccountId = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerByAccountId(req.params.accountId);
    return responseHelper.success(res, customer);
  } catch (error) {
    next(error);
  }
};

const deleteOwnAccount = async (req, res, next) => {
  try {
    const { confirm } = req.body;
    await customerService.deleteOwnAccount(req.user.accountId, confirm);
    return responseHelper.success(res, null, 'Tài khoản đã được vô hiệu hóa thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  updateOwnProfile,
  deleteOwnAccount,
  getCustomerPoints,
  getCustomerPointLogs,
  adjustPoints,
  redeemPoints,
};
