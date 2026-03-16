const prisma = require('../models/prisma');

// Payment
const createPayment = async (data) => {
  return await prisma.payment.create({ data });
};

const findMany = async (where, skip, take) => {
  return await prisma.payment.findMany({
    where, skip, take,
    orderBy: { created_at: 'desc' },
    include: { sessions: true },
  });
};

const count = async (where) => {
  return await prisma.payment.count({ where });
};

const findById = async (id) => {
  return await prisma.payment.findUnique({
    where: { payment_id: id },
    include: {
      sessions: {
        include: { transactions: { include: { payment_method: true } } },
      },
    },
  });
};

const findByOrderId = async (orderId) => {
  return await prisma.payment.findUnique({
    where: { order_id: orderId },
    include: {
      sessions: {
        include: { transactions: { include: { payment_method: true } } },
      },
    },
  });
};

const updatePayment = async (id, data) => {
  return await prisma.payment.update({ where: { payment_id: id }, data });
};

// Session
const createSession = async (data) => {
  return await prisma.paymentSession.create({ data });
};

const findSessionById = async (id) => {
  return await prisma.paymentSession.findUnique({ where: { payment_session_id: id } });
};

const updateSession = async (id, data) => {
  return await prisma.paymentSession.update({ where: { payment_session_id: id }, data });
};

// Transaction
const createTransaction = async (data) => {
  return await prisma.paymentTransaction.create({ data });
};

// Payment Methods
const findAllMethods = async () => {
  return await prisma.paymentMethod.findMany({ where: { is_active: true } });
};

const createMethod = async (data) => {
  return await prisma.paymentMethod.create({ data });
};

module.exports = {
  createPayment,
  findMany,
  count,
  findById,
  findByOrderId,
  updatePayment,
  createSession,
  findSessionById,
  updateSession,
  createTransaction,
  findAllMethods,
  createMethod,
};
