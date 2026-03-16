const { AppError } = require('shared');
const discountRepo = require('../repositories/discount.repo');
const conditionRepo = require('../repositories/discountCondition.repo');

const createDiscount = async (data, user) => {
  const { discountId, discountName, discountType, discountValue, description, startDate, endDate } = data;
  if (!discountId || !discountName || !discountType || !discountValue) {
    throw new AppError('Discount ID, name, type, and value are required', 400);
  }

  const discount = await discountRepo.create({
    discountId, discountName, discountType, discountValue,
    description: description || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    createdBy: user.username,
  });

  // Create empty conditions
  await conditionRepo.createOrUpdate(discountId, { discountId });

  return discount;
};

const getAllDiscounts = async (status) => {
  const query = status ? { status } : {};
  return await discountRepo.findAll(query);
};

const getDiscountById = async (id) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Discount not found', 404);
  const conditions = await conditionRepo.findByDiscountId(id);
  return { ...discount.toObject(), conditions };
};

const updateDiscount = async (id, data) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Discount not found', 404);
  return await discountRepo.update(id, data);
};

const deleteDiscount = async (id) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Discount not found', 404);
  return await discountRepo.update(id, { status: 'INACTIVE' });
};

const updateConditions = async (discountId, data) => {
  const discount = await discountRepo.findByDiscountId(discountId);
  if (!discount) throw new AppError('Discount not found', 404);
  return await conditionRepo.createOrUpdate(discountId, { ...data, discountId });
};

const checkApplicableDiscounts = async ({ orderAmount, productIds, categoryIds, customerType }) => {
  const now = new Date();
  const activeDiscounts = await discountRepo.findAll({
    status: 'ACTIVE',
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
    $or: [{ startDate: null }, { startDate: { $lte: now } }],
  });

  const applicable = [];
  for (const discount of activeDiscounts) {
    const condition = await conditionRepo.findByDiscountId(discount.discountId);
    if (!condition) { applicable.push(discount); continue; }

    let passes = true;
    if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) passes = false;
    if (condition.applicableCustomerTypes?.length > 0 && !condition.applicableCustomerTypes.includes(customerType)) passes = false;
    if (condition.applicableProductIds?.length > 0 && !productIds.some((p) => condition.applicableProductIds.includes(p))) passes = false;
    if (condition.applicableCategoryIds?.length > 0 && !categoryIds.some((c) => condition.applicableCategoryIds.includes(c))) passes = false;

    if (passes) applicable.push({ ...discount.toObject(), conditions: condition });
  }

  return applicable;
};

module.exports = { createDiscount, getAllDiscounts, getDiscountById, updateDiscount, deleteDiscount, updateConditions, checkApplicableDiscounts };
