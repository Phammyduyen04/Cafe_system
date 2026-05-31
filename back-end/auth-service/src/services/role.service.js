const { AppError } = require('../../../shared');
const roleRepo = require('../repositories/role.repo');
const accountRoleRepo = require('../repositories/accountRole.repo');
const accountRepo = require('../repositories/account.repo');

const createRole = async (data) => {
  const { roleName, description } = data;
  if (!roleName) throw new AppError('Role name is required', 400);

  return await roleRepo.create({
    role_name: roleName,
    description: description || null,
  });
};

const getAllRoles = async () => {
  return await roleRepo.findAll();
};

const getRoleById = async (id) => {
  const role = await roleRepo.findById(id);
  if (!role) throw new AppError('Role not found', 404);
  return role;
};

const updateRole = async (id, data) => {
  const role = await roleRepo.findById(id);
  if (!role) throw new AppError('Role not found', 404);

  return await roleRepo.update(id, {
    role_name: data.roleName || role.role_name,
    description: data.description !== undefined ? data.description : role.description,
  });
};

const deleteRole = async (id) => {
  const role = await roleRepo.findById(id);
  if (!role) throw new AppError('Role not found', 404);
  return await roleRepo.delete(id);
};

const assignRole = async (accountId, roleId, assignedBy) => {
  const role = await roleRepo.findById(roleId);
  if (!role) throw new AppError('Role not found', 404);

  // Xóa role cũ và gán role mới
  await accountRoleRepo.revokeAll(accountId);
  const result = await accountRoleRepo.assign(accountId, roleId, assignedBy);

  // Cập nhật userType theo role mới
  const userTypeMap = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    CUSTOMER: 'CUSTOMER',
  };
  const newUserType = userTypeMap[role.role_name] || 'EMPLOYEE';
  await accountRepo.update(accountId, { user_type: newUserType });

  return result;
};

const revokeRole = async (accountId, roleId) => {
  return await accountRoleRepo.revoke(accountId, roleId);
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
