const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    ingredientId: { type: String, required: true, unique: true },
    ingredientName: { type: String, required: true },
    unit: { type: String, required: true },
    currentQuantity: { type: Number, default: 0 },
    image: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: { updatedAt: 'updatedAt' },
    collection: 'ingredients',
  }
);

/**
 * Auto-generate ingredientId as INGR-001, INGR-002, ...
 */
ingredientSchema.pre('validate', async function (next) {
  if (this.isNew && !this.ingredientId) {
    const last = await mongoose.model('Ingredient')
      .findOne({ ingredientId: /^INGR-\d+$/ })
      .sort({ ingredientId: -1 })
      .lean();

    let nextNum = 1;
    if (last) {
      const match = last.ingredientId.match(/^INGR-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.ingredientId = `INGR-${String(nextNum).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
