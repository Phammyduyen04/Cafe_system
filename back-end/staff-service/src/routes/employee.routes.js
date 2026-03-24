const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

// /by-account phải đặt trước /:id
router.get('/by-account/:accountId', employeeController.getEmployeeByAccountId);
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorizeMiddleware('MANAGER', 'ADMIN'), employeeController.createEmployee);
router.put('/:id', authorizeMiddleware('MANAGER'), employeeController.updateEmployee);
router.delete('/:id', authorizeMiddleware('MANAGER'), employeeController.deleteEmployee);

// Availability
router.get('/:id/availability', employeeController.getAvailability);
router.put('/:id/availability', authorizeMiddleware('STAFF'), employeeController.updateAvailability);

// Assigned shifts
router.get('/:id/shifts', employeeController.getEmployeeShifts);

module.exports = router;
