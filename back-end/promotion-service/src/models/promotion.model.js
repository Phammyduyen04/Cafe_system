const mongoose = require('mongoose');
const crypto = require('crypto');

const promotionSchema = new mongoose.Schema(
  {
    promotionId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    promotionName: { type: String, required: true },
    description: { type: String, default: '' },
    benefitType: { type: String, required: true }, // BUY_X_GET_Y, FREE_ITEM, etc.
    status: { type: String, enum: ['PLANNED', 'ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'promotions',
  }
);

module.exports = mongoose.model('Promotion', promotionSchema);
