const Product = require('../models/product.model');

const create = async (data) => await Product.create(data);
const findMany = async (query, skip, limit) => await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
const count = async (query) => await Product.countDocuments(query);
const findByProductId = async (productId) => await Product.findOne({ productId });
const update = async (productId, data) => await Product.findOneAndUpdate({ productId }, data, { new: true });

module.exports = { create, findMany, count, findByProductId, update };
