const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    shiftId: { type: String, required: true },
    employeeId: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String },
    assignmentStatus: { type: String, enum: ['ASSIGNED', 'CONFIRMED', 'CANCELLED'], default: 'ASSIGNED' },
  },
  {
    collection: 'shift_assignments',
  }
);

// Một employee chỉ được assign 1 lần cho mỗi shift
assignmentSchema.index({ shiftId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('ShiftAssignment', assignmentSchema);
