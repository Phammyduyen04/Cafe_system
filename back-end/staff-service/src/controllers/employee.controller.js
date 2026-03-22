const employeeService = require('../services/employee.service');
const { responseHelper } = require('../../../shared');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return responseHelper.created(res, employee, 'Employee created successfully');
  } catch (error) { next(error); }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const { status, position, page = 1, limit = 10 } = req.query;
    const result = await employeeService.getAllEmployees({ status, position }, parseInt(page), parseInt(limit));
    return responseHelper.paginated(res, result.employees, result.pagination);
  } catch (error) { next(error); }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return responseHelper.success(res, employee);
  } catch (error) { next(error); }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    return responseHelper.success(res, employee, 'Employee updated successfully');
  } catch (error) { next(error); }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    return responseHelper.success(res, employee, 'Employee deactivated successfully');
  } catch (error) { next(error); }
};

const getAvailability = async (req, res, next) => {
  try {
    const availability = await employeeService.getAvailability(req.params.id);
    return responseHelper.success(res, availability);
  } catch (error) { next(error); }
};

const updateAvailability = async (req, res, next) => {
  try {
    const availability = await employeeService.updateAvailability(req.params.id, req.body, req.user);
    return responseHelper.success(res, availability, 'Availability updated successfully');
  } catch (error) { next(error); }
};

const getEmployeeByAccountId = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeByAccountId(req.params.accountId);
    return responseHelper.success(res, employee);
  } catch (error) { next(error); }
};

module.exports = { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, getAvailability, updateAvailability, getEmployeeByAccountId };
