const { AppError } = require('../../../shared');
const roleRepo = require('../repositories/role.repo');
const accountRoleRepo = require('../repositories/accountRole.repo');

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
  return await accountRoleRepo.assign(accountId, roleId, assignedBy);
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
