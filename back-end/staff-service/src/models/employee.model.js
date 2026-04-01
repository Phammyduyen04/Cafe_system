const mongoose = require('mongoose');
const crypto = require('crypto');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, default: () => crypto.randomUUID() },
    fullName: { type: String, required: true },
    position: { type: String, enum: ['BARISTA', 'CASHIER', 'WAITER', 'KITCHEN_STAFF', 'MANAGER', 'CLEANER', 'OTHER'], required: true },
    employeeType: { type: String, enum: ['FULL_TIME', 'PART_TIME'], required: true },
    maxWorkingHours: { type: Number, default: null },
    accountId: { type: String, default: null },
    managerId: { type: String, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    inactiveReason: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'employees',
  }
);

// sparse: chỉ enforce unique với giá trị khác null
// nhiều nhân viên có thể đồng thời có accountId: null (chưa được gắn tài khoản)
employeeSchema.index({ accountId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Employee', employeeSchema);
