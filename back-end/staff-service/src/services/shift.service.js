const crypto = require('crypto');
const { AppError } = require('../../../shared');
const shiftRepo = require('../repositories/shift.repo');
const assignmentRepo = require('../repositories/assignment.repo');
const employeeRepo = require('../repositories/employee.repo');

const createShift = async (data, user) => {
  const { shiftName, startTime, endTime, workingDate } = data;
  if (!shiftName || !startTime || !endTime || !workingDate) {
    throw new AppError('Shift name, start time, end time, and working date are required', 400);
  }

  return await shiftRepo.create({
    shiftId: crypto.randomUUID(),
    shiftName, startTime, endTime, workingDate,
    createdByManagerId: user.userId || user.username,
  });
};

const getAllShifts = async (filters, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (filters.date) query.workingDate = filters.date;
  if (filters.status) query.status = filters.status;
  const [shifts, total] = await Promise.all([
    shiftRepo.findMany(query, skip, limit),
    shiftRepo.count(query),
  ]);
  return { shifts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
  return await shiftRepo.update(shift._id, data);
};

const deleteShift = async (id) => {
  const shift = await shiftRepo.findByShiftId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  return await shiftRepo.update(shift._id, { status: 'CANCELLED' });
};

const assignEmployee = async (shiftId, employeeId, user) => {
  const shift = await shiftRepo.findByShiftId(shiftId);
  if (!shift) throw new AppError('Shift not found', 404);
  if (!['PLANNED', 'ACTIVE'].includes(shift.status)) {
    throw new AppError('Cannot assign employee to a shift that is not PLANNED or ACTIVE', 400);
  }

  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.status !== 'ACTIVE') {
    throw new AppError('Cannot assign an inactive employee to a shift', 400);
  }

  return await assignmentRepo.create({
    shiftId,
    employeeId,
    assignedBy: user.userId || user.username,
  });
};

const removeAssignment = async (shiftId, employeeId) => {
  const result = await assignmentRepo.remove(shiftId, employeeId);
  if (!result) throw new AppError('Assignment not found', 404);
  return result;
};

const getShiftAssignments = async (shiftId) => {
  return await assignmentRepo.findByShiftId(shiftId);
};

module.exports = { createShift, getAllShifts, getShiftById, updateShift, deleteShift, assignEmployee, removeAssignment, getShiftAssignments };
