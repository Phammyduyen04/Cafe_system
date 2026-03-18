const { AppError } = require('../../../shared');
const categoryRepo = require('../repositories/category.repo');

const createCategory = async (data) => {
  const { categoryId, categoryName, description } = data;
  if (!categoryId || !categoryName) throw new AppError('Category ID and name are required', 400);
  return await categoryRepo.create({ categoryId, categoryName, description: description || '' });
};

const getAllCategories = async () => {
  return await categoryRepo.findAll();
};

const getCategoryById = async (id) => {
  const category = await categoryRepo.findByCategoryId(id);
  if (!category) throw new AppError('Category not found', 404);
  return category;
};

const updateCategory = async (id, data) => {
  const category = await categoryRepo.findByCategoryId(id);
  if (!category) throw new AppError('Category not found', 404);
  return await categoryRepo.update(id, data);
};

const deleteCategory = async (id) => {
  const category = await categoryRepo.findByCategoryId(id);
  if (!category) throw new AppError('Category not found', 404);
  return await categoryRepo.delete(id);
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
