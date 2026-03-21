const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.get('/', promotionController.getAllPromotions);
router.get('/check', promotionController.checkApplicablePromotions);
router.get('/:id', promotionController.getPromotionById);

router.use(authMiddleware);
router.post('/', authorizeMiddleware('MANAGER'), promotionController.createPromotion);
router.put('/:id', authorizeMiddleware('MANAGER'), promotionController.updatePromotion);
router.delete('/:id', authorizeMiddleware('MANAGER'), promotionController.deletePromotion);

// Conditions
router.put('/:id/conditions', authorizeMiddleware('MANAGER'), promotionController.updateConditions);

module.exports = router;
