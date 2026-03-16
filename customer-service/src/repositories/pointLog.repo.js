const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.customerPointLog.create({ data });
};

const findByCustomerId = async (customerId) => {
  return await prisma.customerPointLog.findMany({
    where: { customer_id: customerId },
    orderBy: { created_at: 'desc' },
  });
};

module.exports = { create, findByCustomerId };
