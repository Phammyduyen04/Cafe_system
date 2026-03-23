const { AppError } = require('../../../shared');
const ingredientRepo = require('../repositories/ingredient.repo');
const importLogRepo = require('../repositories/importLog.repo');

const createIngredient = async (data) => {
  const { ingredientName, unit, currentQuantity, image } = data;
  if (!ingredientName || !unit) {
    throw new AppError('Ingredient name and unit are required', 400);
  }
  return await ingredientRepo.create({
    ingredientName,
    unit,
    currentQuantity: currentQuantity || 0,
    image: image || '',
  });
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

  const { quantityImported, quantity, unitPrice, supplier, note } = data;
  const qty = quantityImported || quantity;
  if (!qty || qty <= 0) {
    throw new AppError('Số lượng nhập phải là số dương', 400);
  }

  // Update current quantity
  const newQuantity = ingredient.currentQuantity + qty;
  await ingredientRepo.update(id, { currentQuantity: newQuantity });

  // Create import log
  const log = await importLogRepo.create({
    ingredientId: id,
    quantityImported: qty,
    unitPrice: unitPrice || 0,
    supplier: supplier || '',
    note: note || '',
  });

  return { ingredient: { ...ingredient.toObject(), currentQuantity: newQuantity }, importLog: log };
};

const getImportLogs = async (ingredientId) => {
  return await importLogRepo.findByIngredientId(ingredientId);
};

module.exports = { createIngredient, getAllIngredients, getIngredientById, updateIngredient, importIngredient, getImportLogs };
