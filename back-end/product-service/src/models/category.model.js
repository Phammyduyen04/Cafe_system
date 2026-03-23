const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, unique: true },
    categoryName: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: true,
    collection: 'product_categories',
  }
);

/**
 * Auto-generate categoryId as CAT-001, CAT-002, ...
 */
categorySchema.pre('validate', async function (next) {
  if (this.isNew && !this.categoryId) {
    const last = await mongoose.model('ProductCategory')
      .findOne({ categoryId: /^CAT-\d+$/ })
      .sort({ categoryId: -1 })
      .lean();

    let nextNum = 1;
    if (last) {
      const match = last.categoryId.match(/^CAT-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.categoryId = `CAT-${String(nextNum).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ProductCategory', categorySchema);
