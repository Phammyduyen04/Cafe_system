const prisma = require('../models/prisma');

const assign = async (accountId, roleId, assignedBy) => {
  return await prisma.accountRole.create({
    data: {
      account_id: accountId,
      role_id: roleId,
      assigned_by: assignedBy,
    },
  });
};

const revoke = async (accountId, roleId) => {
  return await prisma.accountRole.delete({
    where: {
      account_id_role_id: {
        account_id: accountId,
        role_id: roleId,
      },
    },
  });
};

const revokeAll = async (accountId) => {
  return await prisma.accountRole.deleteMany({
    where: { account_id: accountId },
  });
};

module.exports = {
  assign,
  revoke,
  revokeAll,
};
