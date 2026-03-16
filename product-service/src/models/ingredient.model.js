const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    ingredientId: { type: String, required: true, unique: true },
    ingredientName: { type: String, required: true },
    unit: { type: String, required: true },
    currentQuantity: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: { updatedAt: 'updatedAt' },
    collection: 'ingredients',
  }
);

module.exports = mongoose.model('Ingredient', ingredientSchema);
