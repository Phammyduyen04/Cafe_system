const { AppError } = require('shared');
const employeeRepo = require('../repositories/employee.repo');
const availabilityRepo = require('../repositories/availability.repo');

const createEmployee = async (data) => {
  const { employeeId, fullName, position, employeeType, maxWorkingHours, accountId, managerId } = data;
  if (!employeeId || !fullName || !position || !employeeType) {
    throw new AppError('Employee ID, name, position, and type are required', 400);
  }

  const employee = await employeeRepo.create({
    employeeId, fullName, position, employeeType,
    maxWorkingHours: maxWorkingHours || null,
    accountId: accountId || null,
    managerId: managerId || null,
  });

  // Create empty availability
  await availabilityRepo.createOrUpdate(employeeId, { employeeId, availableDays: [], availableTimeRanges: [] });

  return employee;
};

const getAllEmployees = async (filters) => {
  const query = { status: 'ACTIVE' };
  if (filters.status) query.status = filters.status;
  if (filters.position) query.position = filters.position;
  return await employeeRepo.findAll(query);
};

const getEmployeeById = async (id) => {
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  return employee;
};

const updateEmployee = async (id, data) => {
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  return await employeeRepo.update(id, data);
};

const deleteEmployee = async (id) => {
  const employee = await employeeRepo.findByEmployeeId(id);
  if (!employee) throw new AppError('Employee not found', 404);
  return await employeeRepo.update(id, { status: 'INACTIVE' });
};

const getAvailability = async (employeeId) => {
  return await availabilityRepo.findByEmployeeId(employeeId);
};

const updateAvailability = async (employeeId, data) => {
  const employee = await employeeRepo.findByEmployeeId(employeeId);
  if (!employee) throw new AppError('Employee not found', 404);
  return await availabilityRepo.createOrUpdate(employeeId, { ...data, employeeId });
};

module.exports = { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, getAvailability, updateAvailability };
