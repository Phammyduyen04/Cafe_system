const { AppError } = require('../../../shared');
const employeeRepo = require('../repositories/employee.repo');
const availabilityRepo = require('../repositories/availability.repo');

// Sinh employeeId dạng EMP-001, EMP-002, ...
const generateEmployeeId = async () => {
  const all = await employeeRepo.findAll({ employeeId: { $regex: '^EMP-' } });
  let maxNum = 0;
  for (const emp of all) {
    const match = emp.employeeId.match(/^EMP-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `EMP-${String(maxNum + 1).padStart(3, '0')}`;
};

const createEmployee = async (data, user) => {
  const { fullName, position, employeeType, maxWorkingHours, accountId, managerId } = data;
  if (!fullName || !position || !employeeType) {
    throw new AppError('Full name, position, and employee type are required', 400);
  }

  if (accountId) {
    const existing = await employeeRepo.findByAccountId(accountId);
    if (existing) throw new AppError('This accountId is already linked to another employee', 409);
  }

  // Auto-populate managerId từ token nếu không được cung cấp
  let resolvedManagerId = managerId || null;
  if (!resolvedManagerId && user && user.accountId) {
    const managerEmployee = await employeeRepo.findByAccountId(user.accountId);
    if (managerEmployee) resolvedManagerId = managerEmployee.employeeId;
  }

  // FULL_TIME mặc định 40 tiếng/tuần nếu không chỉ định
  const resolvedMaxHours = employeeType === 'FULL_TIME'
    ? (maxWorkingHours || 40)
    : (maxWorkingHours || null);

  const employeeId = await generateEmployeeId();
  const employee = await employeeRepo.create({
    employeeId,
    fullName,
    position,
    employeeType,
    maxWorkingHours: resolvedMaxHours,
    accountId: accountId || null,
    managerId: resolvedManagerId,
  });

  // Tạo availability rỗng
  await availabilityRepo.createOrUpdate(employee.employeeId, {
    employeeId: employee.employeeId,
    availableDays: [],
    availableTimeRanges: [],
  });

  return employee;
};

const getAllEmployees = async (filters, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.position) query.position = filters.position;
  if (filters.employeeType) query.employeeType = filters.employeeType;
  if (filters.hasAccount === 'false') query.accountId = null;
  if (filters.hasAccount === 'true') query.accountId = { $ne: null };
  const [employees, total] = await Promise.all([
    employeeRepo.findMany(query, skip, limit),
    employeeRepo.count(query),
  ]);
  return { employees, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const getEmployeeById = async (id) => {
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);

  if (data.accountId) {
    const existing = await employeeRepo.findByAccountId(data.accountId);
    if (existing && existing.employeeId !== id) {
      throw new AppError('This accountId is already linked to another employee', 409);
    }
  }

  return await employeeRepo.update(employee._id, data);
};

const deleteEmployee = async (id, reason) => {
  if (!reason || !reason.trim()) throw new AppError('Reason is required when deactivating an employee', 400);
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.status === 'INACTIVE') throw new AppError('Employee is already inactive', 400);
  return await employeeRepo.update(employee._id, { status: 'INACTIVE', inactiveReason: reason.trim() });
};

const reactivateEmployee = async (id, reason) => {
  if (!reason || !reason.trim()) throw new AppError('Reason is required when reactivating an employee', 400);
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.status === 'ACTIVE') throw new AppError('Employee is already active', 400);
  return await employeeRepo.update(employee._id, {
    status: 'ACTIVE',
    inactiveReason: null,
    reactivateReason: reason.trim(),
  });
};

const getAvailability = async (employeeId) => {
  return await availabilityRepo.findByEmployeeId(employeeId);
};

// Chỉ STAFF PART_TIME mới được cập nhật lịch rảnh
const updateAvailability = async (employeeId, data, requester) => {
  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Employee not found', 404);

  // Staff chỉ được cập nhật lịch rảnh của bản thân
  if (String(employee.accountId) !== String(requester.accountId)) {
    throw new AppError('You can only update your own availability', 403);
  }

  // FULL_TIME không cần lịch rảnh — manager có thể gán ca bất kỳ
  if (employee.employeeType === 'FULL_TIME') {
    throw new AppError('Full-time employees do not need to set availability as they work all week', 400);
  }

  return await availabilityRepo.createOrUpdate(employeeId, { ...data, employeeId });
};

const getEmployeeByAccountId = async (accountId) => {
  const employee = await employeeRepo.findByAccountId(accountId);
  if (!employee) throw new AppError('Employee not found for this account', 404);
  return employee;
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  reactivateEmployee,
  getAvailability,
  updateAvailability,
  getEmployeeByAccountId,
};
