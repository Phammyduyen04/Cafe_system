const { AppError } = require('../../../shared');
const reviewRepo = require('../repositories/review.repo');
const crypto = require('crypto');

const createReview = async (data) => {
  const { customerName, rating, comment, customerRole, avatar, productId, orderId } = data;
  if (!customerName || !rating || !comment) {
    throw new AppError('customerName, rating và comment là bắt buộc', 400);
  }
  return await reviewRepo.create({
    reviewId: crypto.randomUUID(),
    customerName,
    customerRole: customerRole || '',
    avatar: avatar || '',
    rating: Number(rating),
    comment,
    productId: productId || null,
    orderId: orderId || null,
  });
};

const getStoreReviews = async () => {
  return await reviewRepo.findStoreReviews();
};

const getProductReviews = async (productId) => {
  return await reviewRepo.findByProductId(productId);
};

const getAllReviews = async () => {
  return await reviewRepo.findAll();
};

const updateReview = async (reviewId, data) => {
  const review = await reviewRepo.findByReviewId(reviewId);
  if (!review) throw new AppError('Review không tồn tại', 404);
  return await reviewRepo.update(reviewId, data);
};

const deleteReview = async (reviewId) => {
  const review = await reviewRepo.findByReviewId(reviewId);
  if (!review) throw new AppError('Review không tồn tại', 404);
  return await reviewRepo.remove(reviewId);
};

const getReviewsByOrderId = async (orderId) => {
  return await reviewRepo.findByOrderId(orderId);
};

const checkOrderReviewed = async (orderId) => {
  return await reviewRepo.existsByOrderId(orderId);
};

module.exports = { createReview, getStoreReviews, getProductReviews, getAllReviews, getReviewsByOrderId, checkOrderReviewed, updateReview, deleteReview };
