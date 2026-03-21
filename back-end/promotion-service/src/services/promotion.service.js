const { AppError } = require('../../../shared');
const promotionRepo = require('../repositories/promotion.repo');
const conditionRepo = require('../repositories/promotionCondition.repo');

const createPromotion = async (data, user) => {
  const { promotionId, promotionName, benefitType, description, startDate, endDate } = data;
  if (!promotionId || !promotionName || !benefitType) {
    throw new AppError('Promotion ID, name, and benefit type are required', 400);
  }

  const promotion = await promotionRepo.create({
    promotionId, promotionName, benefitType,
    description: description || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    createdBy: user.username,
  });

  await conditionRepo.createOrUpdate(promotionId, { promotionId });

  return promotion;
};

const getAllPromotions = async (status, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = status ? { status } : {};
  const [promotions, total] = await Promise.all([
    promotionRepo.findMany(query, skip, limit),
    promotionRepo.count(query),
  ]);
  return {
    promotions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getPromotionById = async (id) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Promotion not found', 404);
  const conditions = await conditionRepo.findByPromotionId(id);
  return { ...promotion.toObject(), conditions };
};

const updatePromotion = async (id, data) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Promotion not found', 404);
  return await promotionRepo.update(id, data);
};

const deletePromotion = async (id) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Promotion not found', 404);
  return await promotionRepo.update(id, { status: 'INACTIVE' });
};

const updateConditions = async (promotionId, data) => {
  const promotion = await promotionRepo.findByPromotionId(promotionId);
  if (!promotion) throw new AppError('Promotion not found', 404);
  return await conditionRepo.createOrUpdate(promotionId, { ...data, promotionId });
};

const checkApplicablePromotions = async ({ productIds, orderAmount }) => {
  const now = new Date();
  const activePromotions = await promotionRepo.findAll({
    status: 'ACTIVE',
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  });

  const applicable = [];
  for (const promotion of activePromotions) {
    const condition = await conditionRepo.findByPromotionId(promotion.promotionId);
    if (!condition) { applicable.push(promotion); continue; }

    let passes = true;
    if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) passes = false;
    if (condition.triggerProducts?.length > 0) {
      const hasTrigger = condition.triggerProducts.some((t) => productIds.includes(t.productId));
      if (!hasTrigger) passes = false;
    }

    if (passes) applicable.push({ ...promotion.toObject(), conditions: condition });
  }

  return applicable;
};

module.exports = { createPromotion, getAllPromotions, getPromotionById, updatePromotion, deletePromotion, updateConditions, checkApplicablePromotions };
