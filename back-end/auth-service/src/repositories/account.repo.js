const prisma = require('../models/prisma');

const findByUsername = async (username) => {
  return await prisma.account.findUnique({ where: { username } });
};

const findById = async (id) => {
  return await prisma.account.findUnique({ where: { account_id: id } });
};

const create = async (data) => {
  return await prisma.account.create({ data });
};

const updateLastLogin = async (id) => {
  return await prisma.account.update({
    where: { account_id: id },
    data: { last_login_at: new Date() },
  });
};

const updatePassword = async (id, passwordHash) => {
  return await prisma.account.update({
    where: { account_id: id },
    data: { password_hash: passwordHash },
  });
};

const getAccountRoles = async (accountId) => {
  return await prisma.accountRole.findMany({
    where: { account_id: accountId },
    include: { role: true },
  });
};

const findByGoogleId = async (googleId) => {
  return await prisma.account.findUnique({ where: { google_id: googleId } });
};

const findByEmail = async (email) => {
  return await prisma.account.findFirst({ where: { email } });
};

const findAllByEmail = async (email) => {
  return await prisma.account.findMany({ where: { email } });
};

module.exports = {
  findByUsername,
  findById,
  findByGoogleId,
  findByEmail,
  findAllByEmail,
  create,
  updateLastLogin,
  updatePassword,
  getAccountRoles,
};
