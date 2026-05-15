const { AppError } = require('../../../shared');
const Attendance = require('../models/attendance.model');
const assignmentRepo = require('../repositories/assignment.repo');
const employeeRepo = require('../repositories/employee.repo');
const shiftRepo = require('../repositories/shift.repo');

// Helper: resolve employeeId for requester
// - STAFF: employee must belong to their accountId
// - MANAGER: use provided employeeId directly
const resolveEmployeeId = async (providedEmployeeId, user) => {
  const isStaff = user.roles && user.roles.includes('STAFF') && !user.roles.includes('MANAGER');
  if (isStaff) {
    const employee = await employeeRepo.findByAccountId(user.accountId);
    if (!employee) throw new AppError('Không tìm thấy hồ sơ nhân viên cho tài khoản này', 404);
    if (providedEmployeeId && employee.employeeId !== providedEmployeeId) {
      throw new AppError('Bạn chỉ có thể quản lý chấm công của bản thân', 403);
    }
    return employee.employeeId;
  }
  if (!providedEmployeeId) throw new AppError('Mã nhân viên là bắt buộc', 400);
  return providedEmployeeId;
};

const checkIn = async (data, user) => {
  const { shiftId, employeeId: bodyEmployeeId, note } = data;
  if (!shiftId) throw new AppError('Mã ca làm việc là bắt buộc', 400);

  const employeeId = await resolveEmployeeId(bodyEmployeeId, user);

  // Verify employee exists and is active
  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Không tìm thấy nhân viên', 404);
  if (employee.status !== 'ACTIVE') throw new AppError('Nhân viên không ở trạng thái hoạt động', 400);
  if (!employee.accountId) throw new AppError('Nhân viên chưa được liên kết với tài khoản', 400);

  // Find the shift
  const shift = await shiftRepo.findByShiftId(shiftId);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);

  // Verify there is a valid assignment (ASSIGNED or CONFIRMED)
  const assignment = await assignmentRepo.findOne(shift.shiftId, employeeId);
  if (!assignment || assignment.assignmentStatus === 'CANCELLED') {
    throw new AppError('Nhân viên chưa được phân công vào ca này', 400);
  }

  // Prevent duplicate check-in
  const existing = await Attendance.findOne({ shiftId: shift.shiftId, employeeId });
  if (existing) throw new AppError('Nhân viên đã chấm công vào ca này', 400);

  const checkInTime = new Date();

  // Determine ON_TIME or LATE (grace period: 15 minutes)
  const [year, month, day] = shift.workingDate.split('-').map(Number);
  const [startHour, startMin] = shift.startTime.split(':').map(Number);
  const shiftStart = new Date(year, month - 1, day, startHour, startMin, 0);
  const gracePeriodMs = 15 * 60 * 1000;
  const status = checkInTime <= new Date(shiftStart.getTime() + gracePeriodMs) ? 'ON_TIME' : 'LATE';

  const attendance = await Attendance.create({
    shiftAssignmentId: assignment._id.toString(),
    employeeId,
    shiftId: shift.shiftId,
    checkInTime,
    status,
    note: note || null,
  });

  return attendance;
};

const checkOut = async (data, user) => {
  const { shiftId, employeeId: bodyEmployeeId, note } = data;
  if (!shiftId) throw new AppError('Mã ca làm việc là bắt buộc', 400);

  const employeeId = await resolveEmployeeId(bodyEmployeeId, user);

  const shift = await shiftRepo.findByShiftId(shiftId);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);

  const attendance = await Attendance.findOne({ shiftId: shift.shiftId, employeeId });
  if (!attendance) throw new AppError('Không tìm thấy bản ghi chấm công vào cho ca này', 400);
  if (attendance.checkOutTime) throw new AppError('Nhân viên đã chấm công ra cho ca này', 400);

  const checkOutTime = new Date();
  const actualHours = parseFloat(((checkOutTime - attendance.checkInTime) / 3600000).toFixed(2));

  // Determine EARLY_LEAVE (if check-out is more than 15 min before shift end)
  const [year, month, day] = shift.workingDate.split('-').map(Number);
  const [endHour, endMin] = shift.endTime.split(':').map(Number);
  const shiftEnd = new Date(year, month - 1, day, endHour, endMin, 0);
  const gracePeriodMs = 15 * 60 * 1000;

  let status = attendance.status;
  if (checkOutTime < new Date(shiftEnd.getTime() - gracePeriodMs)) {
    status = 'EARLY_LEAVE';
  }

  const updated = await Attendance.findOneAndUpdate(
    { shiftId: shift.shiftId, employeeId },
    { $set: { checkOutTime, actualHours, status, note: note || attendance.note } },
    { new: true }
  );

  return updated;
};

const getAttendanceByEmployee = async (targetEmployeeId, dateFrom, dateTo, requester) => {
  // STAFF can only view their own attendance
  const isStaff =
    requester.roles &&
    requester.roles.includes('STAFF') &&
    !requester.roles.includes('MANAGER');
  if (isStaff) {
    const employee = await employeeRepo.findByAccountId(requester.accountId);
    if (!employee || employee.employeeId !== targetEmployeeId) {
      throw new AppError('Bạn chỉ có thể xem lịch sử chấm công của bản thân', 403);
    }
  }

  const query = { employeeId: targetEmployeeId };

  if (dateFrom || dateTo) {
    // Join with shifts to filter by workingDate - use shiftId list approach
    const shifts = await shiftRepo.findAll(buildDateQuery(dateFrom, dateTo));
    const shiftIds = shifts.map((s) => s.shiftId);
    query.shiftId = { $in: shiftIds };
  }

  return await Attendance.find(query).sort({ checkInTime: -1 });
};

const buildDateQuery = (dateFrom, dateTo) => {
  const q = {};
  if (dateFrom || dateTo) {
    q.workingDate = {};
    if (dateFrom) q.workingDate.$gte = dateFrom;
    if (dateTo) q.workingDate.$lte = dateTo;
  }
  return q;
};

const getAttendanceSummary = async (employeeId, month, year) => {
  if (!employeeId || !month || !year) {
    throw new AppError('Mã nhân viên, tháng và năm là bắt buộc', 400);
  }

  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  // Get all shifts in that month
  const shifts = await shiftRepo.findAll({ workingDate: { $regex: `^${prefix}` } });
  const shiftIds = shifts.map((s) => s.shiftId);

  const records = await Attendance.find({ employeeId, shiftId: { $in: shiftIds } });

  const totalHours = records.reduce((sum, r) => sum + (r.actualHours || 0), 0);
  const totalShifts = records.length;
  const onTime = records.filter((r) => r.status === 'ON_TIME').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const earlyLeave = records.filter((r) => r.status === 'EARLY_LEAVE').length;

  return {
    employeeId,
    month: parseInt(month),
    year: parseInt(year),
    totalShifts,
    totalHours: parseFloat(totalHours.toFixed(2)),
    onTime,
    late,
    earlyLeave,
    records,
  };
};

module.exports = { checkIn, checkOut, getAttendanceByEmployee, getAttendanceSummary };
