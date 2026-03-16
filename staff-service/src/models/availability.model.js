const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    availableDays: [{ type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] }],
    availableTimeRanges: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: { updatedAt: 'updatedAt' },
    collection: 'employee_availabilities',
  }
);

module.exports = mongoose.model('EmployeeAvailability', availabilitySchema);
