const mongoose = require('mongoose');
const Product = require('../models/product.model');

const create = async (data) => await Product.create(data);
const findMany = async (query, skip, limit) => await Product.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
const count = async (query) => await Product.countDocuments(query);

const findByProductId = async (id) => {
  const byField = await Product.findOne({ productId: id });
  if (byField) return byField;
  if (mongoose.Types.ObjectId.isValid(id)) return await Product.findById(id);
  return null;
};

const update = async (id, data) => {
  const result = await Product.findOneAndUpdate({ productId: id }, data, { new: true });
  if (result) return result;
  if (mongoose.Types.ObjectId.isValid(id)) return await Product.findByIdAndUpdate(id, data, { new: true });
  return null;
};

module.exports = { create, findMany, count, findByProductId, update };
