const Topping = require('../models/topping.model');

const findAll = async (filter = {}) => {
  return await Topping.find(filter).sort({ toppingName: 1 });
};

const findById = async (toppingId) => {
  return await Topping.findOne({ toppingId });
};

const create = async (data) => {
  return await Topping.create(data);
};

const updateById = async (toppingId, data) => {
  return await Topping.findOneAndUpdate({ toppingId }, data, { new: true });
};

const deleteById = async (toppingId) => {
  return await Topping.findOneAndDelete({ toppingId });
};

module.exports = { findAll, findById, create, updateById, deleteById };