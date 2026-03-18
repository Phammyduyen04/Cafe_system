const mongoose = require('mongoose');
const crypto = require('crypto');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, default: () => crypto.randomUUID() },
    fullName: { type: String, required: true },
    position: { type: String, required: true }, // Cashier, Barista, Manager
    employeeType: { type: String, enum: ['FULL_TIME', 'PART_TIME'], required: true },
    maxWorkingHours: { type: Number, default: null },
    accountId: { type: String, default: null },
    managerId: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'employees',
  }
);

module.exports = mongoose.model('Employee', employeeSchema);
