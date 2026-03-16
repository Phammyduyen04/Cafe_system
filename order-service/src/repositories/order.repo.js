const prisma = require('../models/prisma');

const create = async (data) => {
  return await prisma.order.create({
    data,
    include: {
      order_details: { include: { toppings: true } },
      order_discounts: true,
      order_promotions: true,
      status_logs: true,
    },
  });
};

const findMany = async (where, skip, take) => {
  return await prisma.order.findMany({
    where,
    skip,
    take,
    orderBy: { created_at: 'desc' },
    include: {
      order_details: true,
    },
  });
};

const count = async (where) => {
  return await prisma.order.count({ where });
};

const findById = async (id) => {
  return await prisma.order.findUnique({
    where: { order_id: id },
    include: {
      order_details: { include: { toppings: true } },
      order_discounts: true,
      order_promotions: true,
      status_logs: { orderBy: { changed_at: 'desc' } },
    },
  });
};

const updateStatus = async (id, status, statusLog) => {
  return await prisma.order.update({
    where: { order_id: id },
    data: {
      status,
      status_logs: { create: statusLog },
    },
    include: {
      order_details: true,
      status_logs: { orderBy: { changed_at: 'desc' } },
    },
  });
};

const getStatusLogs = async (orderId) => {
  return await prisma.orderStatusLog.findMany({
    where: { order_id: orderId },
    orderBy: { changed_at: 'desc' },
  });
};

module.exports = { create, findMany, count, findById, updateStatus, getStatusLogs };
