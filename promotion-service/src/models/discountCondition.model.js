const mongoose = require('mongoose');

const discountConditionSchema = new mongoose.Schema(
  {
    discountId: { type: String, required: true, unique: true },
    minimumOrderAmount: { type: Number, default: null },
    applicableCustomerTypes: [{ type: String }],
    applicableProductIds: [{ type: String }],
    applicableCategoryIds: [{ type: String }],
    timeFrames: [
      {
        from: { type: String },
        to: { type: String },
      },
    ],
  },
  {
    collection: 'discount_conditions',
  }
);

module.exports = mongoose.model('DiscountCondition', discountConditionSchema);
