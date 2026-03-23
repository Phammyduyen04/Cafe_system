const { AppError } = require('../../../shared');
const promotionRepo = require('../repositories/promotion.repo');
const conditionRepo = require('../repositories/promotionCondition.repo');

// Tính trạng thái dựa vào ngày bắt đầu và kết thúc
const computeStatus = (startDate, endDate) => {
  const now = new Date();
  if (endDate && now > new Date(endDate)) return 'EXPIRED';
  if (startDate && now < new Date(startDate)) return 'PLANNED';
  return 'ACTIVE';
};

// Tự động sinh mã khuyến mãi theo format PROMOTION_001, PROMOTION_002, ...
const generateNextPromotionId = async () => {
  const existing = await promotionRepo.findAll({ promotionId: /^PROMOTION_\d+$/ });
  let maxNum = 0;
  for (const p of existing) {
    const match = p.promotionId.match(/^PROMOTION_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `PROMOTION_${String(maxNum + 1).padStart(3, '0')}`;
};

const createPromotion = async (data, user) => {
  const { promotionName, benefitType, description, startDate, endDate } = data;
  if (!promotionName || !benefitType) {
    throw new AppError('Promotion name and benefit type are required', 400);
  }

  const promotionId = await generateNextPromotionId();

  const promotion = await promotionRepo.create({
    promotionId, promotionName, benefitType,
    description: description || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    status: computeStatus(startDate, endDate),
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
  if (['EXPIRED', 'CANCELLED'].includes(promotion.status)) {
    throw new AppError('Không thể sửa chương trình khuyến mãi đã hết hạn hoặc đã hủy', 400);
  }
  return await promotionRepo.update(id, data);
};

const deletePromotion = async (id) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Promotion not found', 404);
  // Xóa mềm: chỉ đổi trạng thái, không xóa document khỏi DB
  return await promotionRepo.update(id, { status: 'CANCELLED' });
};

const updateConditions = async (promotionId, data) => {
  const promotion = await promotionRepo.findByPromotionId(promotionId);
  if (!promotion) throw new AppError('Promotion not found', 404);
  if (['EXPIRED', 'CANCELLED'].includes(promotion.status)) {
    throw new AppError('Không thể cập nhật điều kiện của chương trình đã hết hạn hoặc đã hủy', 400);
  }
  return await conditionRepo.createOrUpdate(promotionId, { ...data, promotionId });
};

const checkApplicablePromotions = async ({ productIds, orderAmount }) => {
  const activePromotions = await promotionRepo.findAll({ status: 'ACTIVE' });

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
