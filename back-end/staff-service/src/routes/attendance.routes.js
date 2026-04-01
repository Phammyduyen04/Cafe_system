const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

// Check-in / Check-out (STAFF can do for themselves, MANAGER for anyone)
router.post('/check-in', authorizeMiddleware('STAFF', 'MANAGER'), attendanceController.checkIn);
router.post('/check-out', authorizeMiddleware('STAFF', 'MANAGER'), attendanceController.checkOut);

// View attendance history for a specific employee
// STAFF can view their own (service enforces it), MANAGER can view anyone
router.get('/employee/:id', attendanceController.getAttendanceByEmployee);

// Summary report (MANAGER only)
router.get('/summary', authorizeMiddleware('MANAGER'), attendanceController.getAttendanceSummary);

module.exports = router;
