const discountService = require('../services/discount.service');
const { responseHelper } = require('../../../shared');

const createDiscount = async (req, res, next) => {
  try {
    const discount = await discountService.createDiscount(req.body, req.user);
    return responseHelper.created(res, discount, 'Discount created successfully');
  } catch (error) { next(error); }
};

const getAllDiscounts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const discounts = await discountService.getAllDiscounts(status);
    return responseHelper.success(res, discounts);
  } catch (error) { next(error); }
};

const getDiscountById = async (req, res, next) => {
  try {
    const discount = await discountService.getDiscountById(req.params.id);
    return responseHelper.success(res, discount);
  } catch (error) { next(error); }
};

const updateDiscount = async (req, res, next) => {
  try {
    const discount = await discountService.updateDiscount(req.params.id, req.body);
    return responseHelper.success(res, discount, 'Discount updated successfully');
  } catch (error) { next(error); }
};

const deleteDiscount = async (req, res, next) => {
  try {
    await discountService.deleteDiscount(req.params.id);
    return responseHelper.success(res, null, 'Discount deleted successfully');
  } catch (error) { next(error); }
};

const updateConditions = async (req, res, next) => {
  try {
    const conditions = await discountService.updateConditions(req.params.id, req.body);
    return responseHelper.success(res, conditions, 'Conditions updated successfully');
  } catch (error) { next(error); }
};

const checkApplicableDiscounts = async (req, res, next) => {
  try {
    const { orderAmount, productIds, categoryIds, customerType } = req.query;
    const discounts = await discountService.checkApplicableDiscounts({
      orderAmount: parseFloat(orderAmount) || 0,
      productIds: productIds ? productIds.split(',') : [],
      categoryIds: categoryIds ? categoryIds.split(',') : [],
      customerType,
    });
    return responseHelper.success(res, discounts);
  } catch (error) { next(error); }
};

module.exports = { createDiscount, getAllDiscounts, getDiscountById, updateDiscount, deleteDiscount, updateConditions, checkApplicableDiscounts };
