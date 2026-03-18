const Assignment = require('../models/assignment.model');

const create = async (data) => await Assignment.create(data);
const findByShiftId = async (shiftId) => await Assignment.find({ shiftId });
const findByEmployeeId = async (employeeId) => await Assignment.find({ employeeId });
const remove = async (shiftId, employeeId) => await Assignment.findOneAndDelete({ shiftId, employeeId });

module.exports = { create, findByShiftId, findByEmployeeId, remove };
