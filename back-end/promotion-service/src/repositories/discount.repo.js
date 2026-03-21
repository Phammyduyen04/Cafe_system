const Discount = require('../models/discount.model');

const create = async (data) => await Discount.create(data);
const findAll = async (query) => await Discount.find(query).sort({ createdAt: -1 });
const findMany = async (query, skip, limit) => await Discount.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
const count = async (query) => await Discount.countDocuments(query);
const findByDiscountId = async (discountId) => await Discount.findOne({ discountId });
const update = async (discountId, data) => await Discount.findOneAndUpdate({ discountId }, data, { new: true });

module.exports = { create, findAll, findMany, count, findByDiscountId, update };
