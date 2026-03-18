const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    categoryId: { type: String, required: true, unique: true },
    categoryName: { type: String, required: true },
    description: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'product_categories',
  }
);

module.exports = mongoose.model('ProductCategory', categorySchema);
