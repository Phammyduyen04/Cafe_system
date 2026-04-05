const Assignment = require('../models/assignment.model');

const create = async (data) => await Assignment.create(data);

// Chỉ trả về assignment đang active (không lấy CANCELLED)
const findByShiftId = async (shiftId) =>
  await Assignment.find({ shiftId, assignmentStatus: { $ne: 'CANCELLED' } });

const findByEmployeeId = async (employeeId, statuses = null) => {
  const query = { employeeId };
  if (statuses) query.assignmentStatus = { $in: statuses };
  return await Assignment.find(query);
};

const findOne = async (shiftId, employeeId) =>
  await Assignment.findOne({ shiftId, employeeId });

const remove = async (shiftId, employeeId) =>
  await Assignment.findOneAndDelete({ shiftId, employeeId });

const softRemove = async (shiftId, employeeId) =>
  await Assignment.findOneAndUpdate(
    { shiftId, employeeId, assignmentStatus: { $ne: 'CANCELLED' } },
    { $set: { assignmentStatus: 'CANCELLED' } },
    { new: true }
  );

// Kích hoạt lại assignment đã bị CANCELLED (tránh duplicate key khi gán lại)
const reactivate = async (shiftId, employeeId, assignedBy) =>
  await Assignment.findOneAndUpdate(
    { shiftId, employeeId, assignmentStatus: 'CANCELLED' },
    { $set: { assignmentStatus: 'ASSIGNED', assignedAt: new Date(), assignedBy } },
    { new: true }
  );

module.exports = { create, findByShiftId, findByEmployeeId, findOne, remove, softRemove, reactivate };
