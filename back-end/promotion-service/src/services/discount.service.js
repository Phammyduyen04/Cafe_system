const { AppError } = require('../../../shared');
const discountRepo = require('../repositories/discount.repo');
const conditionRepo = require('../repositories/discountCondition.repo');

const computeStatus = (startDate, endDate) => {
  const now = new Date();
  if (endDate && now > new Date(endDate)) return 'EXPIRED';
  if (startDate && now < new Date(startDate)) return 'PLANNED';
  return 'ACTIVE';
};

const generateNextDiscountId = async () => {
  const existing = await discountRepo.findAll({ discountId: /^DISC_\d+$/ });
  let maxNum = 0;
  for (const d of existing) {
    const match = d.discountId.match(/^DISC_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `DISC_${String(maxNum + 1).padStart(3, '0')}`;
};

const createDiscount = async (data, user) => {
  const { discountName, discountType, discountValue, description, startDate, endDate, couponCode, maxUsage, image } = data;
  if (!discountName || !discountType || discountValue == null) {
    throw new AppError('Tên, loại và giá trị giảm giá là bắt buộc', 400);
  }
  if (!startDate || !endDate) {
    throw new AppError('Ngày bắt đầu và kết thúc là bắt buộc', 400);
  }
  if (new Date(endDate) <= new Date(startDate)) {
    throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
  }

  // Validate discountValue
  if (discountType === 'PERCENT') {
    if (discountValue <= 0 || discountValue > 100) {
      throw new AppError('Phần trăm giảm phải từ 1 đến 100', 400);
    }
  } else if (discountType === 'FIXED') {
    if (discountValue <= 0) {
      throw new AppError('Số tiền giảm phải lớn hơn 0', 400);
    }
  }

  // Kiểm tra couponCode trùng lặp
  if (couponCode) {
    const normalizedCode = couponCode.trim().toUpperCase();
    const existing = await discountRepo.findByCouponCode(normalizedCode);
    if (existing) throw new AppError('Mã coupon này đã được sử dụng', 409);
  }

  const discountId = await generateNextDiscountId();

  const discount = await discountRepo.create({
    discountId,
    discountName,
    discountType,
    discountValue,
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

  await conditionRepo.createOrUpdate(discountId, { discountId });

  return discount;
};

const getAllDiscounts = async (status, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = status ? { status } : {};
  const [discounts, total] = await Promise.all([
    discountRepo.findMany(query, skip, limit),
    discountRepo.count(query),
  ]);
  return {
    discounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getDiscountById = async (id) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);
  const conditions = await conditionRepo.findByDiscountId(id);
  return { ...discount.toObject(), conditions };
};

const getDiscountByCoupon = async (code) => {
  if (!code) throw new AppError('Mã coupon là bắt buộc', 400);
  const discount = await discountRepo.findByCouponCode(code.trim().toUpperCase());
  if (!discount) throw new AppError('Mã coupon không hợp lệ hoặc không tồn tại', 404);
  if (discount.status !== 'ACTIVE') {
    throw new AppError('Chương trình giảm giá này không còn hoạt động', 400);
  }
  if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) {
    throw new AppError('Chương trình giảm giá đã đạt giới hạn sử dụng', 400);
  }
  const conditions = await conditionRepo.findByDiscountId(discount.discountId);
  return { ...discount.toObject(), conditions };
};

const updateDiscount = async (id, data) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);
  if (['EXPIRED', 'CANCELLED'].includes(discount.status)) {
    throw new AppError('Không thể sửa chương trình đã hết hạn hoặc đã hủy', 400);
  }
  if (discount.status === 'ACTIVE' && ('startDate' in data || 'endDate' in data)) {
    throw new AppError('Không thể sửa ngày khi chương trình đang hoạt động', 400);
  }

  // Validate discountValue nếu có thay đổi
  const newType  = data.discountType  ?? discount.discountType;
  const newValue = data.discountValue ?? discount.discountValue;
  if (newType === 'PERCENT' && (newValue <= 0 || newValue > 100)) {
    throw new AppError('Phần trăm giảm phải từ 1 đến 100', 400);
  }
  if (newType === 'FIXED' && newValue <= 0) {
    throw new AppError('Số tiền giảm phải lớn hơn 0', 400);
  }

  // Kiểm tra couponCode trùng lặp khi cập nhật
  if (data.couponCode) {
    const normalizedCode = data.couponCode.trim().toUpperCase();
    const existing = await discountRepo.findByCouponCode(normalizedCode);
    if (existing && existing.discountId !== id) {
      throw new AppError('Mã coupon này đã được sử dụng bởi chương trình khác', 409);
    }
    data.couponCode = normalizedCode;
  }

  if (discount.status === 'PLANNED') {
    const newStartDate = 'startDate' in data ? data.startDate : discount.startDate;
    const newEndDate   = 'endDate'   in data ? data.endDate   : discount.endDate;
    data.status = computeStatus(newStartDate, newEndDate);
  }

  return await discountRepo.update(id, data);
};

const deleteDiscount = async (id) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);
  return await discountRepo.update(id, { status: 'CANCELLED' });
};

const updateConditions = async (discountId, data) => {
  const discount = await discountRepo.findByDiscountId(discountId);
  if (!discount) throw new AppError('Không tìm thấy chương trình giảm giá', 404);
  if (['EXPIRED', 'CANCELLED'].includes(discount.status)) {
    throw new AppError('Không thể cập nhật điều kiện của chương trình đã hết hạn hoặc đã hủy', 400);
  }
  return await conditionRepo.createOrUpdate(discountId, { ...data, discountId });
};

const checkApplicableDiscounts = async ({ orderAmount = 0, productIds = [], categoryIds = [], customerType }) => {
  const now = new Date();
  const activeDiscounts = await discountRepo.findAll({ status: 'ACTIVE' });

  const applicable = [];
  for (const discount of activeDiscounts) {
    // Bỏ qua nếu đã đạt giới hạn sử dụng
    if (discount.maxUsage !== null && discount.usageCount >= discount.maxUsage) continue;

    const condition = await conditionRepo.findByDiscountId(discount.discountId);
    if (!condition) { applicable.push(discount.toObject()); continue; }

    let passes = true;

    if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) passes = false;
    if (condition.applicableCustomerTypes?.length > 0 && customerType &&
        !condition.applicableCustomerTypes.includes(customerType)) passes = false;
    if (condition.applicableProductIds?.length > 0 &&
        !productIds.some((p) => condition.applicableProductIds.includes(p))) passes = false;
    if (condition.applicableCategoryIds?.length > 0 &&
        !categoryIds.some((c) => condition.applicableCategoryIds.includes(c))) passes = false;

    if (condition.timeFrames?.length > 0) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inFrame = condition.timeFrames.some((tf) => currentTime >= tf.from && currentTime <= tf.to);
      if (!inFrame) passes = false;
    }

    if (passes) applicable.push({ ...discount.toObject(), conditions: condition });
  }

  return applicable;
};

module.exports = {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  getDiscountByCoupon,
  updateDiscount,
  deleteDiscount,
  updateConditions,
  checkApplicableDiscounts,
};
