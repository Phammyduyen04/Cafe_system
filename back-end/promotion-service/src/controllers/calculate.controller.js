const calculateService = require('../services/calculate.service');
const { responseHelper } = require('../../../shared');

// Preview — tính số tiền giảm, không ghi nhận
const calculate = async (req, res, next) => {
  try {
    const { type, programId, orderAmount, productIds, categoryIds, customerType } = req.body;
    const result = await calculateService.calculate({
      type,
      programId,
      orderAmount: parseFloat(orderAmount) || 0,
      productIds: productIds || [],
      categoryIds: categoryIds || [],
      customerType,
    });
    return responseHelper.success(res, result);
  } catch (error) { next(error); }
};

// Ghi nhận sử dụng sau khi đơn hàng được tạo thành công
const use = async (req, res, next) => {
  try {
    const { type, programId, orderId, customerId, originalAmount, discountAmount } = req.body;
    const record = await calculateService.use({
      type,
      programId,
      orderId,
      customerId,
      originalAmount: parseFloat(originalAmount) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
    });
    return responseHelper.created(res, record, 'Ghi nhận sử dụng thành công');
  } catch (error) { next(error); }
};

// Lịch sử sử dụng của 1 chương trình (dành cho manager)
const getUsageHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await calculateService.getUsageHistory(
      req.params.programId,
      parseInt(page),
      parseInt(limit)
    );
    return responseHelper.paginated(res, result.history, result.pagination);
  } catch (error) { next(error); }
};

module.exports = { calculate, use, getUsageHistory };
