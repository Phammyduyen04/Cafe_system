const { AppError } = require('../../../shared');
const discountRepo = require('../repositories/discount.repo');
const conditionRepo = require('../repositories/discountCondition.repo');

// Tính trạng thái dựa vào ngày bắt đầu và kết thúc
const computeStatus = (startDate, endDate) => {
  const now = new Date();
  if (endDate && now > new Date(endDate)) return 'EXPIRED';
  if (startDate && now < new Date(startDate)) return 'PLANNED';
  return 'ACTIVE';
};

// Tự động sinh mã giảm giá theo format DISCOUNT_001, DISCOUNT_002, ...
const generateNextDiscountId = async () => {
  const existing = await discountRepo.findAll({ discountId: /^DISCOUNT_\d+$/ });
  let maxNum = 0;
  for (const d of existing) {
    const match = d.discountId.match(/^DISCOUNT_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `DISCOUNT_${String(maxNum + 1).padStart(3, '0')}`;
};

const createDiscount = async (data, user) => {
  const { discountName, discountType, discountValue, description, startDate, endDate } = data;
  if (!discountName || !discountType || discountValue == null) {
    throw new AppError('Discount name, type, and value are required', 400);
  }
  if (!startDate || !endDate) {
    throw new AppError('Ngày bắt đầu và kết thúc là bắt buộc', 400);
  }

  const discountId = await generateNextDiscountId();

  const discount = await discountRepo.create({
    discountId, discountName, discountType, discountValue,
    description: description || '',
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    status: computeStatus(startDate, endDate),
    createdBy: user.username,
  });

  // Create empty conditions
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
  if (!discount) throw new AppError('Discount not found', 404);
  const conditions = await conditionRepo.findByDiscountId(id);
  return { ...discount.toObject(), conditions };
};

const updateDiscount = async (id, data) => {
  const discount = await discountRepo.findByDiscountId(id);
  if (!discount) throw new AppError('Discount not found', 404);
  if (['EXPIRED', 'CANCELLED'].includes(discount.status)) {
    throw new AppError('Không thể sửa chương trình giảm giá đã hết hạn hoặc đã hủy', 400);
  }
  if (discount.status === 'ACTIVE' && ('startDate' in data || 'endDate' in data)) {
    throw new AppError('Không thể sửa ngày khi giảm giá đang hoạt động', 400);
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
  if (!discount) throw new AppError('Discount not found', 404);
  // Xóa mềm: chỉ đổi trạng thái, không xóa document khỏi DB
  return await discountRepo.update(id, { status: 'CANCELLED' });
};

const updateConditions = async (discountId, data) => {
  const discount = await discountRepo.findByDiscountId(discountId);
  if (!discount) throw new AppError('Discount not found', 404);
  if (['EXPIRED', 'CANCELLED'].includes(discount.status)) {
    throw new AppError('Không thể cập nhật điều kiện của chương trình đã hết hạn hoặc đã hủy', 400);
  }
  return await conditionRepo.createOrUpdate(discountId, { ...data, discountId });
};

const checkApplicableDiscounts = async ({ orderAmount, productIds, categoryIds, customerType }) => {
  const now = new Date();
  const activeDiscounts = await discountRepo.findAll({ status: 'ACTIVE' });

  const applicable = [];
  for (const discount of activeDiscounts) {
    const condition = await conditionRepo.findByDiscountId(discount.discountId);
    if (!condition) { applicable.push(discount); continue; }

    let passes = true;
    if (condition.minimumOrderAmount && orderAmount < condition.minimumOrderAmount) passes = false;
    if (condition.applicableCustomerTypes?.length > 0 && !condition.applicableCustomerTypes.includes(customerType)) passes = false;
    if (condition.applicableProductIds?.length > 0 && !productIds.some((p) => condition.applicableProductIds.includes(p))) passes = false;
    if (condition.applicableCategoryIds?.length > 0 && !categoryIds.some((c) => condition.applicableCategoryIds.includes(c))) passes = false;

    if (condition.timeFrames?.length > 0) {
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const inFrame = condition.timeFrames.some((tf) => currentTime >= tf.from && currentTime <= tf.to);
      if (!inFrame) passes = false;
    }

    if (passes) applicable.push({ ...discount.toObject(), conditions: condition });
  }

  return applicable;
};

module.exports = { createDiscount, getAllDiscounts, getDiscountById, updateDiscount, deleteDiscount, updateConditions, checkApplicableDiscounts };
