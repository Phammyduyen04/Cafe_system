const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // EMP-001, EMP-002, ... — sinh trong service, không dùng UUID
    employeeId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    position: { type: String, enum: ['BARISTA', 'CASHIER', 'WAITER', 'KITCHEN_STAFF', 'MANAGER', 'CLEANER', 'OTHER'], required: true },
    employeeType: { type: String, enum: ['FULL_TIME', 'PART_TIME'], required: true },
    maxWorkingHours: { type: Number, default: null },
    accountId: { type: String, default: null },
    managerId: { type: String, default: null }, // EMP-XXX của manager phụ trách
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    inactiveReason: { type: String, default: null },
    reactivateReason: { type: String, default: null },
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
