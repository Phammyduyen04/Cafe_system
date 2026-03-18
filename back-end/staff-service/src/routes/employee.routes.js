const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.get('/', employeeController.getAllEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), employeeController.createEmployee);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), employeeController.updateEmployee);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), employeeController.deleteEmployee);

// Availability
router.get('/:id/availability', employeeController.getAvailability);
router.put('/:id/availability', employeeController.updateAvailability);

module.exports = router;
