const Review = require('../models/review.model');

const create = async (data) => await Review.create(data);

const findAll = async (query = {}) =>
  await Review.find(query).sort({ createdAt: -1 });

const findByProductId = async (productId) =>
  await Review.find({ productId, isApproved: true }).sort({ createdAt: -1 });

const findStoreReviews = async () =>
  await Review.find({ productId: null, isApproved: true }).sort({ createdAt: -1 });

const findByReviewId = async (reviewId) =>
  await Review.findOne({ reviewId });

const update = async (reviewId, data) =>
  await Review.findOneAndUpdate({ reviewId }, data, { new: true });

const remove = async (reviewId) =>
  await Review.findOneAndDelete({ reviewId });

module.exports = { create, findAll, findByProductId, findStoreReviews, findByReviewId, update, remove };
