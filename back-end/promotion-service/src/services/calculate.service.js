const { AppError } = require('../../../shared');
const promotionRepo = require('../repositories/promotion.repo');
const promotionConditionRepo = require('../repositories/promotionCondition.repo');
const discountRepo = require('../repositories/discount.repo');
const discountConditionRepo = require('../repositories/discountCondition.repo');
const usageHistoryRepo = require('../repositories/usageHistory.repo');

// ── Helpers ────────────────────────────────────────────────────────────────────

const isPromotionApplicable = async (promotion, { productIds = [], orderAmount = 0, customerType }) => {
  if (promotion.status !== 'ACTIVE') return { ok: false, reason: 'Chương trình không còn hoạt động' };
  if (promotion.maxUsage !== null && promotion.usageCount >= promotion.maxUsage) {
    return { ok: false, reason: 'Chương trình đã đạt giới hạn sử dụng' };
  }

  const condition = await promotionConditionRepo.findByPromotionId(promotion.promotionId);
  if (!condition) return { ok: true, condition: null };

  if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) {
    return { ok: false, reason: `Đơn hàng tối thiểu ${condition.minimumOrderAmount.toLocaleString('vi-VN')}đ` };
  }
  if (condition.applicableCustomerTypes?.length > 0 && customerType &&
      !condition.applicableCustomerTypes.includes(customerType)) {
    return { ok: false, reason: 'Loại khách hàng không được áp dụng' };
  }
  if (condition.triggerProducts?.length > 0) {
    // Tất cả sản phẩm trong đơn phải thuộc danh sách trigger
    const triggerSet = new Set(condition.triggerProducts.map((t) => String(t.productId).trim()));
    const allEligible = productIds.every((id) => id && triggerSet.has(String(id).trim()));
    if (!allEligible) return { ok: false, reason: 'Đơn hàng chứa sản phẩm không thuộc điều kiện khuyến mãi' };
  }

  return { ok: true, condition };
};

const isDiscountApplicable = async (discount, { productIds = [], categoryIds = [], orderAmount = 0, customerType }) => {
  if (discount.status !== 'ACTIVE') return { ok: false, reason: 'Chương trình không còn hoạt động' };
  if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) {
    return { ok: false, reason: 'Chương trình đã đạt giới hạn sử dụng' };
  }

  const condition = await discountConditionRepo.findByDiscountId(discount.discountId);
  if (!condition) return { ok: true, condition: null };

  if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) {
    return { ok: false, reason: `Đơn hàng tối thiểu ${condition.minimumOrderAmount.toLocaleString('vi-VN')}đ` };
  }
  if (condition.applicableCustomerTypes?.length > 0 && customerType &&
      !condition.applicableCustomerTypes.includes(customerType)) {
    return { ok: false, reason: 'Loại khách hàng không được áp dụng' };
  }
  if (condition.applicableProductIds?.length > 0 &&
      !productIds.some((p) => condition.applicableProductIds.includes(p))) {
    return { ok: false, reason: 'Không có sản phẩm nào trong đơn được áp dụng giảm giá' };
  }
  if (condition.applicableCategoryIds?.length > 0 &&
      !categoryIds.some((c) => condition.applicableCategoryIds.includes(c))) {
    return { ok: false, reason: 'Không có danh mục nào trong đơn được áp dụng giảm giá' };
  }
  if (condition.timeFrames?.length > 0) {
    const now = new Date();
    // Dùng UTC+7 (giờ Việt Nam) thay vì giờ server
    const vnHours = (now.getUTCHours() + 7) % 24;
    const currentTime = `${String(vnHours).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
    const inFrame = condition.timeFrames.some((tf) => currentTime >= tf.from && currentTime <= tf.to);
    if (!inFrame) return { ok: false, reason: 'Ngoài khung giờ áp dụng giảm giá' };
  }

  return { ok: true, condition };
};

const computeDiscountAmount = (discount, orderAmount) => {
  if (discount.discountType === 'PERCENT') {
    return Math.round(orderAmount * discount.discountValue / 100);
  }
  // FIXED — không giảm nhiều hơn tổng đơn
  return Math.min(discount.discountValue, orderAmount);
};

// ── Calculate (preview, không ghi nhận) ───────────────────────────────────────

/**
 * Tính số tiền thực tế sau khi áp dụng 1 chương trình.
 * Mỗi đơn hàng chỉ được áp dụng 1 chương trình (PROMOTION hoặc DISCOUNT).
 *
 * Body: { type, programId, orderAmount, productIds, categoryIds, customerType }
 *   - type: 'PROMOTION' | 'DISCOUNT'
 *   - programId: PROMO_001 | DISC_001
 *   - orderAmount: số tiền đơn hàng (trước giảm)
 */
const calculate = async ({ type, programId, orderAmount, productIds = [], categoryIds = [], customerType }) => {
  if (!type || !programId) throw new AppError('type và programId là bắt buộc', 400);
  if (!orderAmount || orderAmount <= 0) throw new AppError('Giá trị đơn hàng phải lớn hơn 0', 400);

  const ctx = { productIds, categoryIds, orderAmount, customerType };

  if (type === 'PROMOTION') {
    const promotion = await promotionRepo.findByPromotionId(programId);
    if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);

    const { ok, reason, condition } = await isPromotionApplicable(promotion, ctx);
    if (!ok) throw new AppError(reason, 400);

    // Promotion không giảm giá tiền — trả về sản phẩm tặng kèm
    return {
      type: 'PROMOTION',
      program: promotion,
      originalAmount: orderAmount,
      discountAmount: 0,
      finalAmount: orderAmount,
      rewardProducts: condition?.rewardProducts ?? [],
    };
  }

  if (type === 'DISCOUNT') {
    const discount = await discountRepo.findByDiscountId(programId);
    if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);

    const { ok, reason } = await isDiscountApplicable(discount, ctx);
    if (!ok) throw new AppError(reason, 400);

    const discountAmount = computeDiscountAmount(discount, orderAmount);
    return {
      type: 'DISCOUNT',
      program: discount,
      originalAmount: orderAmount,
      discountAmount,
      finalAmount: orderAmount - discountAmount,
      rewardProducts: [],
    };
  }

  throw new AppError('type phải là PROMOTION hoặc DISCOUNT', 400);
};

// ── Use (ghi nhận sử dụng sau khi đơn được tạo) ───────────────────────────────

/**
 * Ghi nhận việc áp dụng chương trình vào 1 đơn hàng.
 * Gọi sau khi đơn hàng đã được tạo thành công.
 *
 * Body: { type, programId, orderId, customerId, originalAmount, discountAmount }
 */
const use = async ({ type, programId, orderId, customerId, originalAmount, discountAmount }) => {
  if (!type || !programId || !orderId) {
    throw new AppError('type, programId và orderId là bắt buộc', 400);
  }

  // Mỗi đơn hàng chỉ được dùng 1 chương trình — kiểm tra trùng
  const existed = await usageHistoryRepo.findByOrderId(orderId);
  if (existed) {
    throw new AppError('Đơn hàng này đã áp dụng một chương trình khuyến mãi/giảm giá', 409);
  }

  const finalAmount = (originalAmount ?? 0) - (discountAmount ?? 0);

  if (type === 'PROMOTION') {
    const promotion = await promotionRepo.findByPromotionId(programId);
    if (!promotion) throw new AppError('Không tìm thấy chương trình khuyến mãi', 404);
    if (promotion.maxUsage !== null && promotion.usageCount >= promotion.maxUsage) {
      throw new AppError('Chương trình đã đạt giới hạn sử dụng', 400);
    }
    await promotionRepo.incrementUsage(programId);
  } else if (type === 'DISCOUNT') {
    const discount = await discountRepo.findByDiscountId(programId);
    if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);
    if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) {
      throw new AppError('Chương trình đã đạt giới hạn sử dụng', 400);
    }
    await discountRepo.incrementUsage(programId);
  } else {
    throw new AppError('type phải là PROMOTION hoặc DISCOUNT', 400);
  }

  const record = await usageHistoryRepo.create({
    programId,
    programType: type,
    orderId,
    customerId: customerId ?? null,
    originalAmount: originalAmount ?? 0,
    discountAmount: discountAmount ?? 0,
    finalAmount,
  });

  return record;
};

// ── Lịch sử sử dụng của 1 chương trình ───────────────────────────────────────

const getUsageHistory = async (programId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [history, total] = await Promise.all([
    usageHistoryRepo.findByProgramId(programId, skip, limit),
    usageHistoryRepo.countByProgramId(programId),
  ]);
  return { history, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { calculate, use, getUsageHistory };
