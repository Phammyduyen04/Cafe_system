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

const findAll = async ({ page = 1, limit = 20, search, userType, status } = {}) => {
  const where = {};
  if (userType) where.user_type = userType;
  if (status) where.account_status = status;
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { full_name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.account.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { accountRoles: { include: { role: true } } },
    }),
    prisma.account.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const update = async (id, data) => {
  return await prisma.account.update({ where: { account_id: id }, data });
};

const updateStatus = async (id, status) => {
  return await prisma.account.update({
    where: { account_id: id },
    data: { account_status: status },
  });
};

module.exports = {
  findByUsername,
  findById,
  findByGoogleId,
  findByEmail,
  findAllByEmail,
  findAll,
  create,
  update,
  updateStatus,
  updateLastLogin,
  updatePassword,
  getAccountRoles,
};
