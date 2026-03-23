const mongoose = require('mongoose');
const crypto = require('crypto');

const toppingSchema = new mongoose.Schema(
  {
    toppingId: {
      type: String,
      required: true,
      unique: true,
      default: () => `TOP-${crypto.randomUUID().split('-')[0].toUpperCase()}`,
    },
    toppingName: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_SEASON'], default: 'ACTIVE' },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'toppings',
  }
);

module.exports = mongoose.model('Topping', toppingSchema);