const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    shiftId: { type: String, required: true, unique: true },
    shiftName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    workingDate: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'PLANNED' },
    createdByManagerId: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'work_shifts',
  }
);

module.exports = mongoose.model('WorkShift', shiftSchema);
