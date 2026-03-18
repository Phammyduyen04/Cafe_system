const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// All role routes require authentication and MANAGER/ADMIN role
router.use(authMiddleware);
router.use(authorizeMiddleware('ADMIN', 'MANAGER'));

router.post('/', roleController.createRole);
router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRoleById);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

// Assign / Remove role from account
router.post('/assign', roleController.assignRole);
router.post('/revoke', roleController.revokeRole);

module.exports = router;
