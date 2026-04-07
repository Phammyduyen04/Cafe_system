const mongoose = require('mongoose');

const usageHistorySchema = new mongoose.Schema(
  {
    // PROMOTION_001 hoặc DISCOUNT_001
    programId: { type: String, required: true },
    programType: { type: String, enum: ['PROMOTION', 'DISCOUNT'], required: true },
    orderId: { type: String, required: true },
    customerId: { type: String, default: null },    // accountId của khách
    originalAmount: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'usage_history',
  }
);

usageHistorySchema.index({ programId: 1 });
usageHistorySchema.index({ orderId: 1 }, { unique: true }); // 1 đơn chỉ dùng 1 chương trình

module.exports = mongoose.model('UsageHistory', usageHistorySchema);
