const reviewService = require('../services/review.service');
const { responseHelper } = require('../../../shared');

// GET /api/products/reviews — đánh giá cửa hàng (productId = null)
const getStoreReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getStoreReviews();
    return responseHelper.success(res, reviews);
  } catch (error) { next(error); }
};

// GET /api/products/reviews/all — tất cả (ADMIN)
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getAllReviews();
    return responseHelper.success(res, reviews);
  } catch (error) { next(error); }
};

// GET /api/products/reviews/product/:productId — đánh giá theo sản phẩm
const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    return responseHelper.success(res, reviews);
  } catch (error) { next(error); }
};

// POST /api/products/reviews — tạo đánh giá mới
const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(req.body);
    return responseHelper.created(res, review, 'Đánh giá đã được gửi');
  } catch (error) { next(error); }
};

// PUT /api/products/reviews/:reviewId — cập nhật (ADMIN)
const updateReview = async (req, res, next) => {
  try {
    const review = await reviewService.updateReview(req.params.reviewId, req.body);
    return responseHelper.success(res, review, 'Cập nhật đánh giá thành công');
  } catch (error) { next(error); }
};

// DELETE /api/products/reviews/:reviewId — xoá (ADMIN)
const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.reviewId);
    return responseHelper.success(res, null, 'Xoá đánh giá thành công');
  } catch (error) { next(error); }
};

// GET /api/products/reviews/order/:orderId — đánh giá theo đơn hàng (auth required)
const getReviewsByOrderId = async (req, res, next) => {
  try {
    const reviews = await reviewService.getReviewsByOrderId(req.params.orderId);
    return responseHelper.success(res, reviews);
  } catch (error) { next(error); }
};

// GET /api/products/reviews/order/:orderId/checked — kiểm tra đã đánh giá chưa (auth required)
const checkOrderReviewed = async (req, res, next) => {
  try {
    const reviewed = await reviewService.checkOrderReviewed(req.params.orderId);
    return responseHelper.success(res, { reviewed });
  } catch (error) { next(error); }
};

module.exports = { getStoreReviews, getAllReviews, getProductReviews, createReview, getReviewsByOrderId, checkOrderReviewed, updateReview, deleteReview };
