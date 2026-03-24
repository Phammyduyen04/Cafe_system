const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// Public
router.get('/', reviewController.getStoreReviews);
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', reviewController.createReview);

// Auth required
router.use(authMiddleware);
router.get('/order/:orderId', reviewController.getReviewsByOrderId);
router.get('/order/:orderId/checked', reviewController.checkOrderReviewed);

// Admin/Manager only
router.get('/all', authorizeMiddleware('ADMIN', 'MANAGER'), reviewController.getAllReviews);
router.put('/:reviewId', authorizeMiddleware('ADMIN', 'MANAGER'), reviewController.updateReview);
router.delete('/:reviewId', authorizeMiddleware('ADMIN', 'MANAGER'), reviewController.deleteReview);

module.exports = router;
