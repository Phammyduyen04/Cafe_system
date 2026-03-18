const mongoose = require('mongoose');

const promotionConditionSchema = new mongoose.Schema(
  {
    promotionId: { type: String, required: true, unique: true },
    triggerProducts: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    rewardProducts: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    minimumOrderAmount: { type: Number, default: null },
  },
  {
    collection: 'promotion_conditions',
  }
);

module.exports = mongoose.model('PromotionCondition', promotionConditionSchema);
