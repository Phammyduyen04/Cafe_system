const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema(
  {
    ingredientId: { type: String, required: true },
    importedQuantity: { type: Number, required: true },
    supplier: { type: String },
    importedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  {
    collection: 'ingredient_import_logs',
  }
);

module.exports = mongoose.model('IngredientImportLog', importLogSchema);
