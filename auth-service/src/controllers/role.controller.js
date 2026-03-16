const roleService = require('../services/role.service');
const { responseHelper } = require('shared');

const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body);
    return responseHelper.created(res, role, 'Role created successfully');
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

const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return responseHelper.success(res, role);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    return responseHelper.success(res, role, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id);
    return responseHelper.success(res, null, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { accountId, roleId } = req.body;
    const result = await roleService.assignRole(accountId, roleId, req.user.username);
    return responseHelper.created(res, result, 'Role assigned successfully');
  } catch (error) {
    next(error);
  }
};

const revokeRole = async (req, res, next) => {
  try {
    const { accountId, roleId } = req.body;
    await roleService.revokeRole(accountId, roleId);
    return responseHelper.success(res, null, 'Role revoked successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRole,
  revokeRole,
};
