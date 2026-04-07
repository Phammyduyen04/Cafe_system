const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// Public
router.get('/', discountController.getAllDiscounts);
router.get('/check', discountController.checkApplicableDiscounts);
router.get('/coupon/:code', discountController.getDiscountByCoupon);
router.get('/:id', discountController.getDiscountById);

// Manager only
router.use(authMiddleware);
router.post('/', authorizeMiddleware('MANAGER'), discountController.createDiscount);
router.put('/:id', authorizeMiddleware('MANAGER'), discountController.updateDiscount);
router.delete('/:id', authorizeMiddleware('MANAGER'), discountController.deleteDiscount);
router.put('/:id/conditions', authorizeMiddleware('MANAGER'), discountController.updateConditions);

module.exports = router;
