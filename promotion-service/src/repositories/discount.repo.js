const Discount = require('../models/discount.model');

const create = async (data) => await Discount.create(data);
const findAll = async (query) => await Discount.find(query).sort({ createdAt: -1 });
const findByDiscountId = async (discountId) => await Discount.findOne({ discountId });
const update = async (discountId, data) => await Discount.findOneAndUpdate({ discountId }, data, { new: true });

module.exports = { create, findAll, findByDiscountId, update };
