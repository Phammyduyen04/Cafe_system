const mongoose = require('mongoose');
const crypto = require('crypto');

const discountSchema = new mongoose.Schema(
  {
    discountId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    discountName: { type: String, required: true },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    discountValue: { type: Number, required: true },
    description: { type: String, default: '' },
    couponCode: { type: String, default: undefined },
    maxUsage: { type: Number, default: null },     // null = không giới hạn
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['PLANNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'discounts',
  }
);

// partialFilterExpression: chỉ đánh index khi couponCode là string (bỏ qua null/undefined)
discountSchema.index({ couponCode: 1 }, { unique: true, partialFilterExpression: { couponCode: { $type: 'string' } } });

module.exports = mongoose.model('Discount', discountSchema);
