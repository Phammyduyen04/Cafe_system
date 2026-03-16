const mongoose = require('mongoose');
const crypto = require('crypto');

const discountSchema = new mongoose.Schema(
  {
    discountId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    discountName: { type: String, required: true },
    discountType: { type: String, enum: ['PERCENT', 'FIXED'], required: true },
    discountValue: { type: Number, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'discounts',
  }
);

module.exports = mongoose.model('Discount', discountSchema);
