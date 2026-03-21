const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.post('/', authorizeMiddleware('MANAGER', 'STAFF', 'CUSTOMER'), customerController.createCustomer);
router.get('/', authorizeMiddleware('MANAGER', 'STAFF'), customerController.getAllCustomers);
router.get('/by-account/:accountId', customerController.getCustomerByAccountId);
// /me phải đặt trước /:id để Express không khớp "me" như một id
router.put('/me', authorizeMiddleware('CUSTOMER'), customerController.updateOwnProfile);
router.delete('/me', authorizeMiddleware('CUSTOMER'), customerController.deleteOwnAccount);
router.get('/:id', customerController.getCustomerById);

// Points
router.get('/:id/points', customerController.getCustomerPoints);
router.get('/:id/point-logs', customerController.getCustomerPointLogs);
router.post('/:id/points/adjust', authorizeMiddleware('MANAGER'), customerController.adjustPoints);
router.post('/:id/points/redeem', authorizeMiddleware('MANAGER', 'STAFF', 'CUSTOMER'), customerController.redeemPoints);

module.exports = router;
