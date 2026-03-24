const Topping = require('../models/topping.model');
const mongoose = require('mongoose');

const buildFilter = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ toppingId: id }, { _id: id }] };
  }
  return { toppingId: id };
};

const findAll = async (filter = {}) => {
  return await Topping.find(filter).sort({ toppingName: 1 });
};

const findById = async (id) => {
  return await Topping.findOne(buildFilter(id));
};

const create = async (data) => {
  return await Topping.create(data);
};

const updateById = async (id, data) => {
  return await Topping.findOneAndUpdate(buildFilter(id), data, { new: true });
};

const deleteById = async (id) => {
  return await Topping.findOneAndDelete(buildFilter(id));
};

module.exports = { findAll, findById, create, updateById, deleteById };