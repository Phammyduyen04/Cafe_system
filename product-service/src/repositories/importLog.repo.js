const ImportLog = require('../models/importLog.model');

const create = async (data) => await ImportLog.create(data);
const findByIngredientId = async (ingredientId) => await ImportLog.find({ ingredientId }).sort({ importedAt: -1 });

module.exports = { create, findByIngredientId };
