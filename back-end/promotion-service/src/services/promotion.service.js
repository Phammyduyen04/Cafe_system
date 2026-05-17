const { AppError } = require('../../../shared');
const promotionRepo = require('../repositories/promotion.repo');
const conditionRepo = require('../repositories/promotionCondition.repo');

const toDateOnly = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
};

const computeStatus = (startDate, endDate) => {
  const now = new Date();
  const todayStr = toDateOnly(now);
  if (endDate && toDateOnly(endDate) < todayStr) return 'EXPIRED';
  if (startDate && toDateOnly(startDate) > todayStr) return 'PLANNED';
  return 'ACTIVE';
};

const generateNextPromotionId = async () => {
  const existing = await promotionRepo.findAll({ promotionId: /^PROMO_\d+$/ });
  let maxNum = 0;
  for (const p of existing) {
    const match = p.promotionId.match(/^PROMO_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `PROMO_${String(maxNum + 1).padStart(3, '0')}`;
};

const createPromotion = async (data, user) => {
  const { promotionName, benefitType, description, startDate, endDate, couponCode, maxUsage, image } = data;
  if (!promotionName || !benefitType) {
    throw new AppError('Tên chương trình và loại ưu đãi là bắt buộc', 400);
  }
  if (!startDate || !endDate) {
    throw new AppError('Ngày bắt đầu và kết thúc là bắt buộc', 400);
  }
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  if (startDate < todayStr) {
    throw new AppError('Ngày bắt đầu không được là ngày trong quá khứ', 400);
  }
  if (endDate < startDate) {
    throw new AppError('Ngày kết thúc phải cùng ngày hoặc sau ngày bắt đầu', 400);
  }

  // Kiểm tra couponCode trùng lặp
  if (couponCode) {
    const normalizedCode = couponCode.trim().toUpperCase();
    const existing = await promotionRepo.findByCouponCode(normalizedCode);
    if (existing) throw new AppError('Mã coupon này đã được sử dụng', 409);
  }

  const promotionId = await generateNextPromotionId();

  const promotion = await promotionRepo.create({
    promotionId,
    promotionName,
    benefitType,
    description: description || '',
    image: image || '',
    couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
    maxUsage: maxUsage || null,
    usageCount: 0,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
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
  if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
  const conditions = await conditionRepo.findByPromotionId(id);
  return { ...promotion.toObject(), conditions };
};

const getPromotionByCoupon = async (code) => {
  if (!code) throw new AppError('Mã coupon là bắt buộc', 400);
  const promotion = await promotionRepo.findByCouponCode(code.trim().toUpperCase());
  if (!promotion) throw new AppError('Mã coupon không hợp lệ hoặc không tồn tại', 404);
  if (promotion.status !== 'ACTIVE') {
    throw new AppError('Chương trình khuyến mãi này không còn hoạt động', 400);
  }
  if (promotion.maxUsage !== null && promotion.usageCount >= promotion.maxUsage) {
    throw new AppError('Chương trình khuyến mãi đã đạt giới hạn sử dụng', 400);
  }
  const conditions = await conditionRepo.findByPromotionId(promotion.promotionId);
  return { ...promotion.toObject(), conditions };
};

const updatePromotion = async (id, data) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
  if (['EXPIRED', 'CANCELLED'].includes(promotion.status)) {
    throw new AppError('Không thể sửa chương trình đã hết hạn hoặc đã hủy', 400);
  }
  if (promotion.status === 'ACTIVE' && ('startDate' in data || 'endDate' in data)) {
    throw new AppError('Không thể sửa ngày khi chương trình đang hoạt động', 400);
  }

  // Kiểm tra couponCode trùng lặp khi cập nhật
  if (data.couponCode) {
    const normalizedCode = data.couponCode.trim().toUpperCase();
    const existing = await promotionRepo.findByCouponCode(normalizedCode);
    if (existing && existing.promotionId !== id) {
      throw new AppError('Mã coupon này đã được sử dụng bởi chương trình khác', 409);
    }
    data.couponCode = normalizedCode;
  }

  if (promotion.status === 'PLANNED') {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const toDs = (d) => { const dt = d instanceof Date ? d : new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
    if ('startDate' in data && data.startDate < todayStr) {
      throw new AppError('Ngày bắt đầu không được là ngày trong quá khứ', 400);
    }
    const newStartDate = 'startDate' in data ? data.startDate : toDs(promotion.startDate);
    const newEndDate   = 'endDate'   in data ? data.endDate   : toDs(promotion.endDate);
    if (newEndDate < newStartDate) {
      throw new AppError('Ngày kết thúc phải cùng ngày hoặc sau ngày bắt đầu', 400);
    }
    data.status = computeStatus(newStartDate, newEndDate);
  }

  return await promotionRepo.update(id, data);
};

const deletePromotion = async (id) => {
  const promotion = await promotionRepo.findByPromotionId(id);
  if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
  return await promotionRepo.update(id, { status: 'CANCELLED' });
};

const updateConditions = async (promotionId, data) => {
  const promotion = await promotionRepo.findByPromotionId(promotionId);
  if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
  if (['EXPIRED', 'CANCELLED'].includes(promotion.status)) {
    throw new AppError('Không thể cập nhật điều kiện của chương trình đã hết hạn hoặc đã hủy', 400);
  }
  return await conditionRepo.createOrUpdate(promotionId, { ...data, promotionId });
};

const checkApplicablePromotions = async ({ productIds = [], orderAmount = 0, customerType }) => {
  const activePromotions = await promotionRepo.findAll({ status: 'ACTIVE' });

  const applicable = [];
  for (const promotion of activePromotions) {
    // Bỏ qua nếu đã đạt giới hạn sử dụng
    if (promotion.maxUsage !== null && promotion.usageCount >= promotion.maxUsage) continue;

    const condition = await conditionRepo.findByPromotionId(promotion.promotionId);
    if (!condition) { applicable.push(promotion.toObject()); continue; }

    let passes = true;
    if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) passes = false;
    if (condition.applicableCustomerTypes?.length > 0 && customerType &&
        !condition.applicableCustomerTypes.includes(customerType)) passes = false;
    if (condition.triggerProducts?.length > 0) {
      const hasTrigger = condition.triggerProducts.some((t) => productIds.includes(t.productId));
      if (!hasTrigger) passes = false;
    }

    if (passes) applicable.push({ ...promotion.toObject(), conditions: condition });
  }

  return applicable;
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  getPromotionByCoupon,
  updatePromotion,
  deletePromotion,
  updateConditions,
  checkApplicablePromotions,
};
