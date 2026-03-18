const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.refreshToken.create({ data });
};

const findByToken = async (token) => {
  return await prisma.refreshToken.findUnique({ where: { token } });
};

const revoke = async (id) => {
  return await prisma.refreshToken.update({
    where: { refresh_token_id: id },
    data: { revoked_at: new Date() },
  });
};

const revokeByToken = async (token) => {
  return await prisma.refreshToken.update({
    where: { token },
    data: { revoked_at: new Date() },
  });
};

const revokeAllByAccountId = async (accountId) => {
  return await prisma.refreshToken.updateMany({
    where: { account_id: accountId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
};

module.exports = {
  create,
  findByToken,
  revoke,
  revokeByToken,
  revokeAllByAccountId,
};
