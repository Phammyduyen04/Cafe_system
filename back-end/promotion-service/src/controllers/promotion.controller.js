const promotionService = require('../services/promotion.service');
const { responseHelper } = require('../../../shared');

const createPromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.createPromotion(req.body, req.user);
    return responseHelper.created(res, promotion, 'Promotion created successfully');
  } catch (error) { next(error); }
};

const getAllPromotions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await promotionService.getAllPromotions(status, parseInt(page), parseInt(limit));
    return responseHelper.paginated(res, result.promotions, result.pagination);
  } catch (error) { next(error); }
};

const getPromotionById = async (req, res, next) => {
  try {
    const promotion = await promotionService.getPromotionById(req.params.id);
    return responseHelper.success(res, promotion);
  } catch (error) { next(error); }
};

const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await promotionService.updatePromotion(req.params.id, req.body);
    return responseHelper.success(res, promotion, 'Promotion updated successfully');
  } catch (error) { next(error); }
};

const deletePromotion = async (req, res, next) => {
  try {
    await promotionService.deletePromotion(req.params.id);
    return responseHelper.success(res, null, 'Promotion deleted successfully');
  } catch (error) { next(error); }
};

const updateConditions = async (req, res, next) => {
  try {
    const conditions = await promotionService.updateConditions(req.params.id, req.body);
    return responseHelper.success(res, conditions, 'Conditions updated successfully');
  } catch (error) { next(error); }
};

const checkApplicablePromotions = async (req, res, next) => {
  try {
    const { productIds, orderAmount } = req.query;
    const promotions = await promotionService.checkApplicablePromotions({
      productIds: productIds ? productIds.split(',') : [],
      orderAmount: parseFloat(orderAmount) || 0,
    });
    return responseHelper.success(res, promotions);
  } catch (error) { next(error); }
};

module.exports = { createPromotion, getAllPromotions, getPromotionById, updatePromotion, deletePromotion, updateConditions, checkApplicablePromotions };
