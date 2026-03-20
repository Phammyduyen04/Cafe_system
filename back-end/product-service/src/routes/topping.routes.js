const express = require('express');
const router = express.Router();
const toppingController = require('../controllers/topping.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// Public routes — không cần auth
router.get('/', toppingController.getAllToppings);
router.get('/:id', toppingController.getToppingById);

// Protected routes — chỉ ADMIN/MANAGER
router.use(authMiddleware);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), toppingController.createTopping);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), toppingController.updateTopping);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), toppingController.deleteTopping);

module.exports = router;