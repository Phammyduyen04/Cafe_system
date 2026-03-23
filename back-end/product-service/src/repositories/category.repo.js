const Category = require('../models/category.model');

const create = async (data) => await Category.create(data);
const findAll = async (filter = {}) => {
  let query = { ...filter };
  // Documents seeded without a status field are treated as ACTIVE
  if (filter.status === 'ACTIVE') {
    query = { $or: [{ status: 'ACTIVE' }, { status: { $exists: false } }] };
  }
  return await Category.find(query).sort({ status: 1, categoryName: 1 });
};
const findByCategoryId = async (categoryId) => await Category.findOne({ categoryId });
const update = async (categoryId, data) => await Category.findOneAndUpdate({ categoryId }, data, { new: true });
const deleteCategory = async (categoryId) => await Category.findOneAndDelete({ categoryId });

module.exports = { create, findAll, findByCategoryId, update, delete: deleteCategory };
