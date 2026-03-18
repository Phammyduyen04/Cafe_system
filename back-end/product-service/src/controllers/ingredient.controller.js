const ingredientService = require('../services/ingredient.service');
const { responseHelper } = require('../../../shared');

const createIngredient = async (req, res, next) => {
  try {
    const ingredient = await ingredientService.createIngredient(req.body);
    return responseHelper.created(res, ingredient, 'Ingredient created successfully');
  } catch (error) { next(error); }
};

const getAllIngredients = async (req, res, next) => {
  try {
    const ingredients = await ingredientService.getAllIngredients();
    return responseHelper.success(res, ingredients);
  } catch (error) { next(error); }
};

const getIngredientById = async (req, res, next) => {
  try {
    const ingredient = await ingredientService.getIngredientById(req.params.id);
    return responseHelper.success(res, ingredient);
  } catch (error) { next(error); }
};

const updateIngredient = async (req, res, next) => {
  try {
    const ingredient = await ingredientService.updateIngredient(req.params.id, req.body);
    return responseHelper.success(res, ingredient, 'Ingredient updated successfully');
  } catch (error) { next(error); }
};

const importIngredient = async (req, res, next) => {
  try {
    const result = await ingredientService.importIngredient(req.params.id, req.body);
    return responseHelper.created(res, result, 'Ingredient imported successfully');
  } catch (error) { next(error); }
};

const getImportLogs = async (req, res, next) => {
  try {
    const logs = await ingredientService.getImportLogs(req.params.id);
    return responseHelper.success(res, logs);
  } catch (error) { next(error); }
};

module.exports = { createIngredient, getAllIngredients, getIngredientById, updateIngredient, importIngredient, getImportLogs };
