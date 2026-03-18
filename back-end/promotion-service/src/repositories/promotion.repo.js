const Promotion = require('../models/promotion.model');

const create = async (data) => await Promotion.create(data);
const findAll = async (query) => await Promotion.find(query).sort({ createdAt: -1 });
const findByPromotionId = async (promotionId) => await Promotion.findOne({ promotionId });
const update = async (promotionId, data) => await Promotion.findOneAndUpdate({ promotionId }, data, { new: true });

module.exports = { create, findAll, findByPromotionId, update };
