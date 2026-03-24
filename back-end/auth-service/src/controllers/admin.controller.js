const adminService = require('../services/admin.service');
const roleService = require('../services/role.service');
const { responseHelper } = require('../../../shared');

const createStaffAccount = async (req, res, next) => {
  try {
    const result = await adminService.createStaffAccount(req.user.username, req.body);
    return responseHelper.created(res, result, 'Tài khoản nhân viên đã được tạo thành công');
  } catch (error) {
    next(error);
  }
};

const listAccounts = async (req, res, next) => {
  try {
    const result = await adminService.listAccounts(req.query);
    return responseHelper.paginated(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getAccount = async (req, res, next) => {
  try {
    const result = await adminService.getAccount(req.params.id);
    return responseHelper.success(res, result);
  } catch (error) {
    next(error);
  }
};

const updateAccount = async (req, res, next) => {
  try {
    const result = await adminService.updateAccount(req.params.id, req.body);
    return responseHelper.success(res, result, 'Cập nhật tài khoản thành công');
  } catch (error) {
    next(error);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const result = await adminService.toggleAccountStatus(req.params.id);
    return responseHelper.success(res, result, `Tài khoản đã được ${result.status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hoá'}`);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await adminService.resetAccountPassword(req.params.id);
    return responseHelper.success(res, result, 'Đặt lại mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getAllRoles();
    return responseHelper.success(res, roles);
  } catch (error) {
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { accountId, roleId } = req.body;
    const result = await roleService.assignRole(accountId, roleId, req.user.username);
    return responseHelper.created(res, result, 'Gán quyền thành công');
  } catch (error) {
    next(error);
  }
};

const revokeRole = async (req, res, next) => {
  try {
    const { accountId, roleId } = req.body;
    await roleService.revokeRole(accountId, roleId);
    return responseHelper.success(res, null, 'Thu hồi quyền thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStaffAccount,
  listAccounts,
  getAccount,
  updateAccount,
  toggleStatus,
  resetPassword,
  getAllRoles,
  assignRole,
  revokeRole,
};
