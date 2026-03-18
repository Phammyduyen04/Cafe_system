const mongoose = require('mongoose');
const crypto = require('crypto');

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    productCategoryId: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isAvailable: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'products',
  }
);

module.exports = mongoose.model('Product', productSchema);
