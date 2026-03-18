const Ingredient = require('../models/ingredient.model');

const create = async (data) => await Ingredient.create(data);
const findAll = async () => await Ingredient.find({ status: 'ACTIVE' }).sort({ ingredientName: 1 });
const findByIngredientId = async (ingredientId) => await Ingredient.findOne({ ingredientId });
const update = async (ingredientId, data) => await Ingredient.findOneAndUpdate({ ingredientId }, data, { new: true });

module.exports = { create, findAll, findByIngredientId, update };
