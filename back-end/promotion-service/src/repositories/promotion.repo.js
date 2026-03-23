const Promotion = require('../models/promotion.model');

const create = async (data) => await Promotion.create(data);
const findAll = async (query) => await Promotion.find(query).sort({ createdAt: -1 });
const findMany = async (query, skip, limit) => await Promotion.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
const count = async (query) => await Promotion.countDocuments(query);
const findByPromotionId = async (promotionId) => await Promotion.findOne({ promotionId });
const update = async (promotionId, data) => await Promotion.findOneAndUpdate({ promotionId }, { $set: data }, { new: true });

module.exports = { create, findAll, findMany, count, findByPromotionId, update };
