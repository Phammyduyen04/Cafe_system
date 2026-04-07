const Discount = require('../models/discount.model');

const create = async (data) => await Discount.create(data);
const findAll = async (query) => await Discount.find(query).sort({ createdAt: -1 });
const findMany = async (query, skip, limit) =>
  await Discount.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
const count = async (query) => await Discount.countDocuments(query);
const findByDiscountId = async (discountId) => await Discount.findOne({ discountId });
const findByCouponCode = async (couponCode) =>
  await Discount.findOne({ couponCode: couponCode.toUpperCase() });
const update = async (discountId, data) =>
  await Discount.findOneAndUpdate({ discountId }, { $set: data }, { new: true });
const incrementUsage = async (discountId) =>
  await Discount.findOneAndUpdate(
    { discountId },
    { $inc: { usageCount: 1 } },
    { new: true }
  );

module.exports = { create, findAll, findMany, count, findByDiscountId, findByCouponCode, update, incrementUsage };
