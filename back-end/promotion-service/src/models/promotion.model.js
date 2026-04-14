const mongoose = require('mongoose');
const crypto = require('crypto');

const promotionSchema = new mongoose.Schema(
  {
    promotionId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    promotionName: { type: String, required: true },
    description: { type: String, default: '' },
    benefitType: {
      type: String,
      enum: ['BUY_X_GET_Y', 'FREE_ITEM', 'GIFT_WITH_ORDER'],
      required: true,
    },
    couponCode: { type: String, default: undefined },
    maxUsage: { type: Number, default: null },     // null = không giới hạn
    usageCount: { type: Number, default: 0 },
    status: { type: String, enum: ['PLANNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    image: { type: String, default: '' },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'promotions',
  }
);

// partialFilterExpression: chỉ đánh index khi couponCode là string (bỏ qua null/undefined)
promotionSchema.index({ couponCode: 1 }, { unique: true, partialFilterExpression: { couponCode: { $type: 'string' } } });

module.exports = mongoose.model('Promotion', promotionSchema);
