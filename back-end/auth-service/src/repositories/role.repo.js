const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.role.create({ data });
};

const findAll = async () => {
  return await prisma.role.findMany({ orderBy: { role_id: 'asc' } });
};

const findById = async (id) => {
  return await prisma.role.findUnique({ where: { role_id: id } });
};

const findByName = async (name) => {
  return await prisma.role.findUnique({ where: { role_name: name } });
};

const update = async (id, data) => {
  return await prisma.role.update({ where: { role_id: id }, data });
};

const deleteRole = async (id) => {
  return await prisma.role.delete({ where: { role_id: id } });
};

module.exports = {
  create,
  findAll,
  findById,
  findByName,
  update,
  delete: deleteRole,
};
