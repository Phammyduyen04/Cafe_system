const UsageHistory = require('../models/usageHistory.model');

const create = async (data) => await UsageHistory.create(data);

const findByOrderId = async (orderId) => await UsageHistory.findOne({ orderId });

const findByProgramId = async (programId, skip = 0, limit = 20) =>
  await UsageHistory.find({ programId }).sort({ usedAt: -1 }).skip(skip).limit(limit);

const countByProgramId = async (programId) =>
  await UsageHistory.countDocuments({ programId });

const findByCustomerId = async (customerId, skip = 0, limit = 20) =>
  await UsageHistory.find({ customerId }).sort({ usedAt: -1 }).skip(skip).limit(limit);

module.exports = { create, findByOrderId, findByProgramId, countByProgramId, findByCustomerId };
