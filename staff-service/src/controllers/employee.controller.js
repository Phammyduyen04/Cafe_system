const employeeService = require('../services/employee.service');
const { responseHelper } = require('shared');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return responseHelper.created(res, employee, 'Employee created successfully');
  } catch (error) { next(error); }
};

const getAllEmployees = async (req, res, next) => {
  try {
    const { status, position } = req.query;
    const employees = await employeeService.getAllEmployees({ status, position });
    return responseHelper.success(res, employees);
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
    await employeeService.deleteEmployee(req.params.id);
    return responseHelper.success(res, null, 'Employee deleted successfully');
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
    const availability = await employeeService.updateAvailability(req.params.id, req.body);
    return responseHelper.success(res, availability, 'Availability updated successfully');
  } catch (error) { next(error); }
};

module.exports = { createEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, getAvailability, updateAvailability };
