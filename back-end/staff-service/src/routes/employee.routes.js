const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

// /by-account phải đặt trước /:id
router.get('/by-account/:accountId', employeeController.getEmployeeByAccountId);
router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorizeMiddleware('MANAGER'), employeeController.createEmployee);
router.put('/:id', authorizeMiddleware('MANAGER'), employeeController.updateEmployee);
router.put('/:id/deactivate', authorizeMiddleware('MANAGER'), employeeController.deleteEmployee);
router.put('/:id/activate', authorizeMiddleware('MANAGER'), employeeController.reactivateEmployee);

// Availability
router.get('/:id/availability', employeeController.getAvailability);
router.put('/:id/availability', authorizeMiddleware('EMPLOYEE'), employeeController.updateAvailability);

// Assigned shifts
router.get('/:id/shifts', employeeController.getEmployeeShifts);

module.exports = router;
