const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.customer.create({ data });
};

const findMany = async (where, skip, take) => {
  return await prisma.customer.findMany({ where, skip, take, orderBy: { created_at: 'desc' } });
};

const count = async (where) => {
  return await prisma.customer.count({ where });
};

const findById = async (id) => {
  return await prisma.customer.findUnique({ where: { customer_id: id } });
};

const findByAccountId = async (accountId) => {
  return await prisma.customer.findUnique({ where: { account_id: accountId } });
};

const update = async (id, data) => {
  return await prisma.customer.update({ where: { customer_id: id }, data });
};

const findByPhoneNumber = async (phoneNumber) => {
  return await prisma.customer.findUnique({ where: { phone_number: phoneNumber } });
};

const findByEmail = async (email) => {
  return await prisma.customer.findUnique({ where: { email } });
};

module.exports = { create, findMany, count, findById, findByAccountId, findByPhoneNumber, findByEmail, update };
