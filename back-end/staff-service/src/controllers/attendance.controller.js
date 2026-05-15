const attendanceService = require('../services/attendance.service');
const { responseHelper } = require('../../../shared');

const checkIn = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkIn(req.body, req.user);
    return responseHelper.created(res, attendance, 'Chấm công vào thành công');
  } catch (error) { next(error); }
};

const checkOut = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkOut(req.body, req.user);
    return responseHelper.success(res, attendance, 'Chấm công ra thành công');
  } catch (error) { next(error); }
};

const getAttendanceByEmployee = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const records = await attendanceService.getAttendanceByEmployee(
      req.params.id,
      dateFrom,
      dateTo,
      req.user
    );
    return responseHelper.success(res, records);
  } catch (error) { next(error); }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query;
    const summary = await attendanceService.getAttendanceSummary(employeeId, month, year);
    return responseHelper.success(res, summary);
  } catch (error) { next(error); }
};

module.exports = { checkIn, checkOut, getAttendanceByEmployee, getAttendanceSummary };
