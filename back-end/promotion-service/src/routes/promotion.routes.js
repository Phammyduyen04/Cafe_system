const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// Public
router.get('/', promotionController.getAllPromotions);
router.get('/check', promotionController.checkApplicablePromotions);
router.get('/coupon/:code', promotionController.getPromotionByCoupon);
router.get('/:id', promotionController.getPromotionById);

// Manager only
router.use(authMiddleware);
router.post('/', authorizeMiddleware('MANAGER'), promotionController.createPromotion);
router.put('/:id', authorizeMiddleware('MANAGER'), promotionController.updatePromotion);
router.delete('/:id', authorizeMiddleware('MANAGER'), promotionController.deletePromotion);
router.put('/:id/conditions', authorizeMiddleware('MANAGER'), promotionController.updateConditions);

module.exports = router;
