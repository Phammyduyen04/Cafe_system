const shiftService = require('../services/shift.service');
const { responseHelper } = require('../../../shared');

const createShift = async (req, res, next) => {
  try {
    const shift = await shiftService.createShift(req.body, req.user);
    return responseHelper.created(res, shift, 'Shift created successfully');
  } catch (error) { next(error); }
};

const getAllShifts = async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 10 } = req.query;
    const result = await shiftService.getAllShifts({ date, status }, parseInt(page), parseInt(limit));
    return responseHelper.paginated(res, result.shifts, result.pagination);
  } catch (error) { next(error); }
};

const getShiftById = async (req, res, next) => {
  try {
    const shift = await shiftService.getShiftById(req.params.id);
    return responseHelper.success(res, shift);
  } catch (error) { next(error); }
};

const updateShift = async (req, res, next) => {
  try {
    const shift = await shiftService.updateShift(req.params.id, req.body);
    return responseHelper.success(res, shift, 'Shift updated successfully');
  } catch (error) { next(error); }
};

const deleteShift = async (req, res, next) => {
  try {
    const shift = await shiftService.deleteShift(req.params.id);
    return responseHelper.success(res, shift, 'Shift cancelled successfully');
  } catch (error) { next(error); }
};

const assignEmployee = async (req, res, next) => {
  try {
    const { employeeId } = req.body;
    const assignment = await shiftService.assignEmployee(req.params.id, employeeId, req.user);
    return responseHelper.created(res, assignment, 'Employee assigned to shift');
  } catch (error) { next(error); }
};

const removeAssignment = async (req, res, next) => {
  try {
    await shiftService.removeAssignment(req.params.id, req.params.employeeId);
    return responseHelper.success(res, null, 'Assignment removed');
  } catch (error) { next(error); }
};

const getShiftAssignments = async (req, res, next) => {
  try {
    const assignments = await shiftService.getShiftAssignments(req.params.id);
    return responseHelper.success(res, assignments);
  } catch (error) { next(error); }
};

module.exports = { createShift, getAllShifts, getShiftById, updateShift, deleteShift, assignEmployee, removeAssignment, getShiftAssignments };
