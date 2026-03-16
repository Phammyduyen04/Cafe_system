const { AppError } = require('shared');
const ingredientRepo = require('../repositories/ingredient.repo');
const importLogRepo = require('../repositories/importLog.repo');

const createIngredient = async (data) => {
  const { ingredientId, ingredientName, unit } = data;
  if (!ingredientId || !ingredientName || !unit) {
    throw new AppError('Ingredient ID, name, and unit are required', 400);
  }
  return await ingredientRepo.create({ ingredientId, ingredientName, unit });
};

const getAllIngredients = async () => {
  return await ingredientRepo.findAll();
};

const getIngredientById = async (id) => {
  const ingredient = await ingredientRepo.findByIngredientId(id);
  if (!ingredient) throw new AppError('Ingredient not found', 404);
  return ingredient;
};

const updateIngredient = async (id, data) => {
  const ingredient = await ingredientRepo.findByIngredientId(id);
  if (!ingredient) throw new AppError('Ingredient not found', 404);
  return await ingredientRepo.update(id, data);
};

const importIngredient = async (id, data) => {
  const ingredient = await ingredientRepo.findByIngredientId(id);
  if (!ingredient) throw new AppError('Ingredient not found', 404);

  const { importedQuantity, supplier, note } = data;
  if (!importedQuantity || importedQuantity <= 0) {
    throw new AppError('Imported quantity must be a positive number', 400);
  }

  // Update current quantity
  const newQuantity = ingredient.currentQuantity + importedQuantity;
  await ingredientRepo.update(id, { currentQuantity: newQuantity });

  // Create import log
  const log = await importLogRepo.create({
    ingredientId: id,
    importedQuantity,
    supplier: supplier || '',
    note: note || '',
  });

  return { ingredient: { ...ingredient.toObject(), currentQuantity: newQuantity }, importLog: log };
};

const getImportLogs = async (ingredientId) => {
  return await importLogRepo.findByIngredientId(ingredientId);
};

module.exports = { createIngredient, getAllIngredients, getIngredientById, updateIngredient, importIngredient, getImportLogs };
