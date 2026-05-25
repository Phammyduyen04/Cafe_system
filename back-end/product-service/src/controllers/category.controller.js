const categoryService = require('../services/category.service');
const { responseHelper } = require('../../../shared');

const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);
    return responseHelper.created(res, category, 'Category created successfully');
  } catch (error) { next(error); }
};

const getAllCategories = async (req, res, next) => {
  try {
    const userType = req.user?.userType;
    const includeInactive = ['ADMIN', 'MANAGER'].includes(userType) || req.query.all === 'true';
    const categories = await categoryService.getAllCategories(includeInactive);
    return responseHelper.success(res, categories);
  } catch (error) { next(error); }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return responseHelper.success(res, category);
  } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    return responseHelper.success(res, category, 'Category updated successfully');
  } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    return responseHelper.success(res, null, 'Category deleted successfully');
  } catch (error) { next(error); }
};

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory };
