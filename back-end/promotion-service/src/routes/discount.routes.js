const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.get('/', discountController.getAllDiscounts);
router.get('/check', discountController.checkApplicableDiscounts);
router.get('/:id', discountController.getDiscountById);

router.use(authMiddleware);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), discountController.createDiscount);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), discountController.updateDiscount);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), discountController.deleteDiscount);

// Conditions
router.put('/:id/conditions', authorizeMiddleware('ADMIN', 'MANAGER'), discountController.updateConditions);

module.exports = router;
