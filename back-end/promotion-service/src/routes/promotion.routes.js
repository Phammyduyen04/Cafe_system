const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.get('/', promotionController.getAllPromotions);
router.get('/check', promotionController.checkApplicablePromotions);
router.get('/:id', promotionController.getPromotionById);

router.use(authMiddleware);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), promotionController.createPromotion);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), promotionController.updatePromotion);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), promotionController.deletePromotion);

// Conditions
router.put('/:id/conditions', authorizeMiddleware('ADMIN', 'MANAGER'), promotionController.updateConditions);

module.exports = router;
