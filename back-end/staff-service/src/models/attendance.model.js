const mongoose = require('mongoose');
const crypto = require('crypto');

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, unique: true, default: () => crypto.randomUUID() },
    shiftAssignmentId: { type: String, default: null },
    employeeId: { type: String, required: true },
    shiftId: { type: String, required: true },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    actualHours: { type: Number, default: null },
    status: {
      type: String,
      enum: ['ON_TIME', 'LATE', 'ABSENT', 'EARLY_LEAVE'],
      default: null,
    },
    note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    collection: 'attendances',
  }
);

attendanceSchema.index({ employeeId: 1, shiftId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
