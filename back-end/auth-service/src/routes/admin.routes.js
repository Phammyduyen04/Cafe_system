const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// All admin routes require auth + ADMIN role
router.use(authMiddleware);
router.use(authorizeMiddleware('ADMIN'));

// Account management
router.get('/accounts',                    adminController.listAccounts);
router.post('/accounts',                   adminController.createStaffAccount);
router.get('/accounts/:id',                adminController.getAccount);
router.put('/accounts/:id',                adminController.updateAccount);
router.put('/accounts/:id/status',       adminController.toggleStatus);
router.put('/accounts/:id/reset-password', adminController.resetPassword);

// Role / permission management
router.get('/roles',         adminController.getAllRoles);
router.post('/roles/assign', adminController.assignRole);
router.post('/roles/revoke', adminController.revokeRole);

module.exports = router;
