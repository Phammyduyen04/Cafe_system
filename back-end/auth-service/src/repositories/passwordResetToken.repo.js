const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.passwordResetToken.create({ data });
};

const findLatestByAccountId = async (accountId) => {
  return await prisma.passwordResetToken.findFirst({
    where: {
      account_id: accountId,
      used_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });
};

const markUsed = async (resetTokenId) => {
  return await prisma.passwordResetToken.update({
    where: { reset_token_id: resetTokenId },
    data: { used_at: new Date() },
  });
};

const findLatestByEmail = async (email) => {
  return await prisma.passwordResetToken.findFirst({
    where: {
      account: { email },
      used_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });
};

const deleteAllByAccountId = async (accountId) => {
  return await prisma.passwordResetToken.deleteMany({
    where: { account_id: accountId },
  });
};

module.exports = {
  create,
  findLatestByAccountId,
  findLatestByEmail,
  markUsed,
  deleteAllByAccountId,
};
