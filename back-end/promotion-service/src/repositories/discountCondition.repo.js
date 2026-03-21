const DiscountCondition = require('../models/discountCondition.model');

const findByDiscountId = async (discountId) => await DiscountCondition.findOne({ discountId });
const createOrUpdate = async (discountId, data) => {
  return await DiscountCondition.findOneAndUpdate(
    { discountId },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = { findByDiscountId, createOrUpdate };
