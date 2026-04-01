const Assignment = require('../models/assignment.model');

const create = async (data) => await Assignment.create(data);
const findByShiftId = async (shiftId) => await Assignment.find({ shiftId });
const findByEmployeeId = async (employeeId, statuses = null) => {
  const query = { employeeId };
  if (statuses) query.assignmentStatus = { $in: statuses };
  return await Assignment.find(query);
};
const findOne = async (shiftId, employeeId) => await Assignment.findOne({ shiftId, employeeId });
const remove = async (shiftId, employeeId) => await Assignment.findOneAndDelete({ shiftId, employeeId });
const softRemove = async (shiftId, employeeId) =>
  await Assignment.findOneAndUpdate(
    { shiftId, employeeId, assignmentStatus: { $ne: 'CANCELLED' } },
    { $set: { assignmentStatus: 'CANCELLED' } },
    { new: true }
  );

module.exports = { create, findByShiftId, findByEmployeeId, findOne, remove, softRemove };
