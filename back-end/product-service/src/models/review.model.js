const mongoose = require('mongoose');
const crypto = require('crypto');

const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    customerName: { type: String, required: true },
    avatar: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    // productId nếu là đánh giá sản phẩm, để trống nếu là đánh giá cửa hàng
    productId: { type: String, default: null },
    isApproved: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'reviews',
  }
);

module.exports = mongoose.model('Review', reviewSchema);
