const Category = require('../models/category.model');

const create = async (data) => await Category.create(data);
const findAll = async () => await Category.find().sort({ categoryName: 1 });
const findByCategoryId = async (categoryId) => await Category.findOne({ categoryId });
const update = async (categoryId, data) => await Category.findOneAndUpdate({ categoryId }, data, { new: true });
const deleteCategory = async (categoryId) => await Category.findOneAndDelete({ categoryId });

module.exports = { create, findAll, findByCategoryId, update, delete: deleteCategory };
