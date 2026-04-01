const crypto = require('crypto');
const mongoose = require('mongoose');
const { AppError } = require('../../../shared');
const shiftRepo = require('../repositories/shift.repo');
const assignmentRepo = require('../repositories/assignment.repo');
const employeeRepo = require('../repositories/employee.repo');
const availabilityRepo = require('../repositories/availability.repo');

// Helper: convert HH:MM to minutes
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Helper: check if two time intervals [s1,e1) and [s2,e2) overlap
const timesOverlap = (s1, e1, s2, e2) =>
  toMinutes(s1) < toMinutes(e2) && toMinutes(s2) < toMinutes(e1);

// Helper: YYYY-MM-DD → MON/TUE/WED/THU/FRI/SAT/SUN
const getDayOfWeek = (dateStr) => {
  const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAY_MAP[d.getDay()];
};

// Accept both custom shiftId (UUID) and MongoDB _id (ObjectId)
const findShiftByAnyId = async (id) => {
  let shift = await shiftRepo.findByShiftId(id);
  if (!shift && mongoose.Types.ObjectId.isValid(id)) {
    shift = await shiftRepo.findById(id);
  }
  return shift;
};

const createShift = async (data, user) => {
  const { shiftName, startTime, endTime, workingDate } = data;
  if (!shiftName || !startTime || !endTime || !workingDate) {
    throw new AppError('Shift name, start time, end time, and working date are required', 400);
  }

  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new AppError('startTime must be before endTime', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = workingDate.split('-').map(Number);
  const shiftDate = new Date(y, m - 1, d);
  if (shiftDate < today) {
    throw new AppError('workingDate cannot be in the past', 400);
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
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  const assignments = await assignmentRepo.findByShiftId(shift.shiftId);
  return { ...shift.toObject(), assignments };
};

const updateShift = async (id, data) => {
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  return await shiftRepo.update(shift._id, data);
};

const deleteShift = async (id) => {
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Shift not found', 404);
  return await shiftRepo.update(shift._id, { status: 'CANCELLED' });
};

const assignEmployee = async (shiftId, employeeId, user) => {
  const shift = await findShiftByAnyId(shiftId);
  if (!shift) throw new AppError('Shift not found', 404);
  if (!['PLANNED', 'ACTIVE'].includes(shift.status)) {
    throw new AppError('Cannot assign employee to a shift that is not PLANNED or ACTIVE', 400);
  }

  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.status !== 'ACTIVE') {
    throw new AppError('Cannot assign an inactive employee to a shift', 400);
  }
  if (!employee.accountId) {
    throw new AppError('Cannot assign employee who does not have an account yet', 400);
  }

  // Check duplicate assignment (non-cancelled)
  const existing = await assignmentRepo.findOne(shift.shiftId, employeeId);
  if (existing && existing.assignmentStatus !== 'CANCELLED') {
    throw new AppError('Employee is already assigned to this shift', 400);
  }

  // Check availability (only if employee has availability data set)
  const availability = await availabilityRepo.findByEmployeeId(employeeId);
  if (availability) {
    if (availability.availableDays && availability.availableDays.length > 0) {
      const dayOfWeek = getDayOfWeek(shift.workingDate);
      if (!availability.availableDays.includes(dayOfWeek)) {
        throw new AppError(`Employee is not available on ${dayOfWeek} (workingDate: ${shift.workingDate})`, 400);
      }
    }
    if (availability.availableTimeRanges && availability.availableTimeRanges.length > 0) {
      const shiftStart = toMinutes(shift.startTime);
      const shiftEnd = toMinutes(shift.endTime);
      const covered = availability.availableTimeRanges.some(
        (range) => toMinutes(range.start) <= shiftStart && toMinutes(range.end) >= shiftEnd
      );
      if (!covered) {
        throw new AppError(
          `Shift time (${shift.startTime}-${shift.endTime}) is outside employee's available time ranges`,
          400
        );
      }
    }
  }

  // Check schedule conflict: same employee, same workingDate, overlapping time
  const existingAssignments = await assignmentRepo.findByEmployeeId(employeeId, ['ASSIGNED', 'CONFIRMED']);
  if (existingAssignments.length > 0) {
    const existingShiftIds = existingAssignments.map((a) => a.shiftId);
    const sameDayShifts = await shiftRepo.findAll({
      shiftId: { $in: existingShiftIds },
      workingDate: shift.workingDate,
      status: { $ne: 'CANCELLED' },
    });
    for (const s of sameDayShifts) {
      if (timesOverlap(shift.startTime, shift.endTime, s.startTime, s.endTime)) {
        throw new AppError(
          `Schedule conflict: employee already has shift "${s.shiftName}" (${s.startTime}-${s.endTime}) on ${shift.workingDate}`,
          400
        );
      }
    }
  }

  return await assignmentRepo.create({
    shiftId: shift.shiftId,
    employeeId,
    assignedBy: user.userId || user.username,
  });
};

const removeAssignment = async (shiftId, employeeId) => {
  const shift = await findShiftByAnyId(shiftId);
  const resolvedShiftId = shift ? shift.shiftId : shiftId;
  const result = await assignmentRepo.softRemove(resolvedShiftId, employeeId);
  if (!result) throw new AppError('Assignment not found or already cancelled', 404);
  return result;
};

const getShiftAssignments = async (shiftId) => {
  const shift = await findShiftByAnyId(shiftId);
  const resolvedShiftId = shift ? shift.shiftId : shiftId;
  return await assignmentRepo.findByShiftId(resolvedShiftId);
};

const getShiftsByEmployee = async (employeeId, filters = {}) => {
  const assignments = await assignmentRepo.findByEmployeeId(employeeId);
  if (!assignments.length) {
    return { shifts: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
  }
  const shiftIds = assignments.map((a) => a.shiftId);
  const query = { shiftId: { $in: shiftIds } };
  if (filters.date) query.workingDate = filters.date;
  if (filters.status) query.status = filters.status;
  const shifts = await shiftRepo.findAll(query);
  return { shifts, pagination: { page: 1, limit: shifts.length, total: shifts.length, totalPages: 1 } };
};

module.exports = { createShift, getAllShifts, getShiftById, updateShift, deleteShift, assignEmployee, removeAssignment, getShiftAssignments, getShiftsByEmployee };
