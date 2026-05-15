const mongoose = require('mongoose');
const { AppError } = require('../../../shared');
const shiftRepo = require('../repositories/shift.repo');
const assignmentRepo = require('../repositories/assignment.repo');
const employeeRepo = require('../repositories/employee.repo');
const availabilityRepo = require('../repositories/availability.repo');

// ─── Helpers ─────────────────────────────────────────────────────────────────

// HH:MM → phút
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Thời lượng ca (giờ)
const shiftDurationHours = (startTime, endTime) =>
  (toMinutes(endTime) - toMinutes(startTime)) / 60;

// Kiểm tra hai khoảng thời gian có overlap không
const timesOverlap = (s1, e1, s2, e2) =>
  toMinutes(s1) < toMinutes(e2) && toMinutes(s2) < toMinutes(e1);

// YYYY-MM-DD → MON/TUE/WED/THU/FRI/SAT/SUN
const getDayOfWeek = (dateStr) => {
  const DAY_MAP = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAY_MAP[d.getDay()];
};

// Lấy khoảng [Thứ Hai, Chủ Nhật] của tuần chứa dateStr
const getWeekRange = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay(); // 0=CN
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt) => dt.toISOString().split('T')[0];
  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
};

// Tính trạng thái thực tế của ca dựa theo giờ hiện tại
// CANCELLED được giữ nguyên, không override bởi thời gian
const computeShiftStatus = (shift) => {
  if (shift.status === 'CANCELLED') return 'CANCELLED';
  const now = new Date();
  const [year, month, day] = shift.workingDate.split('-').map(Number);
  const [startH, startM] = shift.startTime.split(':').map(Number);
  const [endH, endM] = shift.endTime.split(':').map(Number);
  const shiftStart = new Date(year, month - 1, day, startH, startM, 0);
  const shiftEnd = new Date(year, month - 1, day, endH, endM, 0);
  if (now < shiftStart) return 'PLANNED';
  if (now < shiftEnd) return 'ACTIVE';
  return 'COMPLETED';
};

// Cập nhật DB nếu trạng thái tính được khác trạng thái đang lưu
const syncShiftStatus = async (shift) => {
  const computed = computeShiftStatus(shift);
  if (computed !== shift.status) {
    return await shiftRepo.update(shift._id, { status: computed });
  }
  return shift;
};

// Tìm ca theo shiftId (UUID) hoặc MongoDB _id
const findShiftByAnyId = async (id) => {
  let shift = await shiftRepo.findByShiftId(id);
  if (!shift && mongoose.Types.ObjectId.isValid(id)) {
    shift = await shiftRepo.findById(id);
  }
  return shift;
};

// ─── CRUD ca ─────────────────────────────────────────────────────────────────

const createShift = async (data, user) => {
  const { shiftName, startTime, endTime, workingDate } = data;
  if (!shiftName || !startTime || !endTime || !workingDate) {
    throw new AppError('Tên ca, giờ bắt đầu, giờ kết thúc và ngày làm việc là bắt buộc', 400);
  }
  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new AppError('Giờ bắt đầu phải trước giờ kết thúc', 400);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = workingDate.split('-').map(Number);
  if (new Date(y, m - 1, d) < today) {
    throw new AppError('Ngày làm việc không được là ngày trong quá khứ', 400);
  }
  return await shiftRepo.create({
    shiftId: require('crypto').randomUUID(),
    shiftName,
    startTime,
    endTime,
    workingDate,
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

  // Đồng bộ trạng thái tự động (lazy update)
  const synced = await Promise.all(shifts.map(syncShiftStatus));
  return { shifts: synced, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getShiftById = async (id) => {
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);
  const synced = await syncShiftStatus(shift);
  const assignments = await assignmentRepo.findByShiftId(synced.shiftId);
  return { ...synced.toObject(), assignments };
};

const updateShift = async (id, data) => {
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);
  return await shiftRepo.update(shift._id, data);
};

// Manager hủy ca — bắt buộc nhập lý do
const deleteShift = async (id, reason) => {
  if (!reason || !reason.trim()) {
    throw new AppError('Vui lòng nhập lý do khi hủy ca làm việc', 400);
  }
  const shift = await findShiftByAnyId(id);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);
  const currentStatus = computeShiftStatus(shift);
  if (currentStatus === 'CANCELLED') {
    throw new AppError('Ca làm việc đã bị hủy', 400);
  }
  if (currentStatus === 'COMPLETED') {
    throw new AppError('Không thể hủy ca làm việc đã hoàn thành', 400);
  }
  return await shiftRepo.update(shift._id, { status: 'CANCELLED', cancelReason: reason.trim() });
};

// ─── Phân công ───────────────────────────────────────────────────────────────

const assignEmployee = async (shiftId, employeeId, user) => {
  const shift = await findShiftByAnyId(shiftId);
  if (!shift) throw new AppError('Không tìm thấy ca làm việc', 404);

  // Dùng trạng thái tính toán thực tế để validate
  const effectiveStatus = computeShiftStatus(shift);
  if (!['PLANNED', 'ACTIVE'].includes(effectiveStatus)) {
    throw new AppError('Không thể gán nhân viên vào ca không ở trạng thái PLANNED hoặc ACTIVE', 400);
  }

  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Không tìm thấy nhân viên', 404);
  if (employee.status !== 'ACTIVE') {
    throw new AppError('Không thể gán nhân viên không hoạt động vào ca', 400);
  }
  if (!employee.accountId) {
    throw new AppError('Không thể gán nhân viên chưa có tài khoản', 400);
  }

  // Kiểm tra trùng assignment
  const existing = await assignmentRepo.findOne(shift.shiftId, employeeId);
  if (existing) {
    if (existing.assignmentStatus !== 'CANCELLED') {
      throw new AppError('Nhân viên đã được gán vào ca này', 400);
    }
    // Đã từng gán rồi bị gỡ → reactivate thay vì tạo mới (tránh duplicate key)
    // Vẫn chạy qua toàn bộ validation giờ/tuần phía dưới trước khi reactivate
  }

  // Kiểm tra xung đột lịch (áp dụng cho cả FULL_TIME và PART_TIME)
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
          `Xung đột lịch: nhân viên đã có ca "${s.shiftName}" (${s.startTime}-${s.endTime}) vào ngày ${shift.workingDate}`,
          400
        );
      }
    }
  }

  if (employee.employeeType === 'FULL_TIME') {
    // FULL_TIME: bỏ qua lịch rảnh, kiểm tra tổng giờ trong tuần
    const maxHours = employee.maxWorkingHours || 40;
    const { weekStart, weekEnd } = getWeekRange(shift.workingDate);
    const weekAssignments = await assignmentRepo.findByEmployeeId(employeeId, ['ASSIGNED', 'CONFIRMED']);
    if (weekAssignments.length > 0) {
      const weekShiftIds = weekAssignments.map((a) => a.shiftId);
      const weekShifts = await shiftRepo.findAll({
        shiftId: { $in: weekShiftIds },
        workingDate: { $gte: weekStart, $lte: weekEnd },
        status: { $ne: 'CANCELLED' },
      });
      const totalHours = weekShifts.reduce(
        (sum, s) => sum + shiftDurationHours(s.startTime, s.endTime),
        0
      );
      const newHours = shiftDurationHours(shift.startTime, shift.endTime);
      if (totalHours + newHours > maxHours) {
        throw new AppError(
          `Không thể gán: nhân viên sẽ vượt quá ${maxHours}h/tuần (hiện tại: ${totalHours.toFixed(1)}h, ca mới: ${newHours.toFixed(1)}h)`,
          400
        );
      }
    }
  } else {
    // PART_TIME: kiểm tra availability (ngày + giờ)
    const availability = await availabilityRepo.findByEmployeeId(employeeId);
    if (availability) {
      if (availability.availableDays && availability.availableDays.length > 0) {
        const dayOfWeek = getDayOfWeek(shift.workingDate);
        if (!availability.availableDays.includes(dayOfWeek)) {
          throw new AppError(
            `Nhân viên không rảnh vào ${dayOfWeek} (ngày làm: ${shift.workingDate})`,
            400
          );
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
            `Thời gian ca (${shift.startTime}-${shift.endTime}) nằm ngoài khung giờ rảnh của nhân viên`,
            400
          );
        }
      }
    }
  }

  const assignedBy = user.userId || user.username;

  // Nếu đã có bản ghi CANCELLED → reactivate (tránh duplicate key error)
  if (existing && existing.assignmentStatus === 'CANCELLED') {
    return await assignmentRepo.reactivate(shift.shiftId, employeeId, assignedBy);
  }

  return await assignmentRepo.create({
    shiftId: shift.shiftId,
    employeeId,
    assignedBy,
  });
};

const removeAssignment = async (shiftId, employeeId) => {
  const shift = await findShiftByAnyId(shiftId);
  const resolvedShiftId = shift ? shift.shiftId : shiftId;
  const result = await assignmentRepo.softRemove(resolvedShiftId, employeeId);
  if (!result) throw new AppError('Không tìm thấy phân công hoặc đã bị hủy', 404);
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
  const synced = await Promise.all(shifts.map(syncShiftStatus));
  return { shifts: synced, pagination: { page: 1, limit: synced.length, total: synced.length, totalPages: 1 } };
};

module.exports = {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignEmployee,
  removeAssignment,
  getShiftAssignments,
  getShiftsByEmployee,
};
