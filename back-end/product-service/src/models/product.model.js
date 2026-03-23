const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    productCategoryId: { type: String, required: true },
    image: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_SEASON'], default: 'ACTIVE' },
    isAvailable: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'products',
  }
);

/**
 * Auto-generate productId as PROD-001, PROD-002, ... before saving
 */
productSchema.pre('validate', async function (next) {
  if (this.isNew && !this.productId) {
    const last = await mongoose.model('Product')
      .findOne({ productId: /^PROD-\d+$/ })
      .sort({ productId: -1 })
      .lean();

    let nextNum = 1;
    if (last) {
      const match = last.productId.match(/^PROD-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.productId = `PROD-${String(nextNum).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
