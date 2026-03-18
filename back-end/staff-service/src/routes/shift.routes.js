const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.get('/', shiftController.getAllShifts);
router.get('/:id', shiftController.getShiftById);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), shiftController.createShift);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), shiftController.updateShift);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), shiftController.deleteShift);

// Assignments
router.post('/:id/assignments', authorizeMiddleware('ADMIN', 'MANAGER'), shiftController.assignEmployee);
router.delete('/:id/assignments/:employeeId', authorizeMiddleware('ADMIN', 'MANAGER'), shiftController.removeAssignment);
router.get('/:id/assignments', shiftController.getShiftAssignments);

module.exports = router;
