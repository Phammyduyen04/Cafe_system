const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema(
  {
    ingredientId: { type: String, required: true },
    quantityImported: { type: Number, required: true },
    unitPrice: { type: Number, default: 0 },
    supplier: { type: String, default: '' },
    importedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  {
    collection: 'ingredient_import_logs',
  }
);

module.exports = mongoose.model('IngredientImportLog', importLogSchema);
