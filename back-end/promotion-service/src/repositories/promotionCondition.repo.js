const PromotionCondition = require('../models/promotionCondition.model');

const findByPromotionId = async (promotionId) => await PromotionCondition.findOne({ promotionId });
const createOrUpdate = async (promotionId, data) => {
  return await PromotionCondition.findOneAndUpdate({ promotionId }, data, { upsert: true, new: true });
};

module.exports = { findByPromotionId, createOrUpdate };
