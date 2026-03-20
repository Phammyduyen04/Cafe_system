const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.post('/', authorizeMiddleware('ADMIN', 'MANAGER', 'EMPLOYEE', 'CUSTOMER'), customerController.createCustomer);
router.get('/', authorizeMiddleware('ADMIN', 'MANAGER', 'EMPLOYEE'), customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), customerController.updateCustomer);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), customerController.deleteCustomer);

// Points
router.get('/:id/points', customerController.getCustomerPoints);
router.get('/:id/point-logs', customerController.getCustomerPointLogs);
router.post('/:id/points', authorizeMiddleware('ADMIN', 'MANAGER'), customerController.adjustPoints);

module.exports = router;
