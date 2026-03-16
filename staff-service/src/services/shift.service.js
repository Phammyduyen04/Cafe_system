const { AppError } = require('shared');
const shiftRepo = require('../repositories/shift.repo');
const assignmentRepo = require('../repositories/assignment.repo');
const employeeRepo = require('../repositories/employee.repo');

const createShift = async (data, user) => {
  const { shiftId, shiftName, startTime, endTime, workingDate } = data;
  if (!shiftId || !shiftName || !startTime || !endTime || !workingDate) {
    throw new AppError('Shift ID, name, start time, end time, and working date are required', 400);
  }

  return await shiftRepo.create({
    shiftId, shiftName, startTime, endTime, workingDate,
    createdByManagerId: user.userId || user.username,
  });
};

const getAllShifts = async (filters) => {
  const query = {};
  if (filters.date) query.workingDate = filters.date;
  if (filters.status) query.status = filters.status;
  return await shiftRepo.findAll(query);
};

const getShiftById = async (id) => {
  const shift = await shiftRepo.findByShiftId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  const assignments = await assignmentRepo.findByShiftId(id);
  return { ...shift.toObject(), assignments };
};

const updateShift = async (id, data) => {
  const shift = await shiftRepo.findByShiftId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  return await shiftRepo.update(id, data);
};

const deleteShift = async (id) => {
  const shift = await shiftRepo.findByShiftId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  return await shiftRepo.update(id, { status: 'CANCELLED' });
};

const assignEmployee = async (shiftId, employeeId, user) => {
  const shift = await shiftRepo.findByShiftId(shiftId);
  if (!shift) throw new AppError('Shift not found', 404);

  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Employee not found', 404);

  return await assignmentRepo.create({
    shiftId,
    employeeId,
    assignedBy: user.userId || user.username,
  });
};

const removeAssignment = async (shiftId, employeeId) => {
  return await assignmentRepo.remove(shiftId, employeeId);
};

const getShiftAssignments = async (shiftId) => {
  return await assignmentRepo.findByShiftId(shiftId);
};

module.exports = { createShift, getAllShifts, getShiftById, updateShift, deleteShift, assignEmployee, removeAssignment, getShiftAssignments };
