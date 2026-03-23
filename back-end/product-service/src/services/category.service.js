const { AppError } = require('../../../shared');
const categoryRepo = require('../repositories/category.repo');

const createCategory = async (data) => {
  const { categoryName, description } = data;
  if (!categoryName) throw new AppError('Category name is required', 400);
  return await categoryRepo.create({ categoryName, description: description || '' });
};

const getAllCategories = async (includeInactive = false) => {
  return await categoryRepo.findAll(includeInactive ? {} : { status: 'ACTIVE' });
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

// Soft-delete: set status INACTIVE instead of removing
const deleteCategory = async (id) => {
  const category = await categoryRepo.findByCategoryId(id);
  if (!category) throw new AppError('Category not found', 404);
  return await categoryRepo.update(id, { status: 'INACTIVE' });
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
