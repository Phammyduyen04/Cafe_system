const axios = require('axios');
const { AppError } = require('../../../shared');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3005';
const TOPPING_SERVICE_URL = `${PRODUCT_SERVICE_URL}/toppings`;

/**
 * Gọi product-service để lấy thông tin sản phẩm theo productId
 * Trả về thông tin sản phẩm hoặc throw AppError nếu không tồn tại / không khả dụng
 */
const getProductById = async (productId) => {
  try {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
    const product = response.data.data;

    if (!product) {
      throw new AppError(`Sản phẩm "${productId}" không tồn tại trong hệ thống`, 404);
    }

    if (product.status !== 'ACTIVE' || !product.isAvailable) {
      throw new AppError(`Sản phẩm "${product.productName}" hiện không khả dụng`, 400);
    }

    return product;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error.response && error.response.status === 404) {
      throw new AppError(`Sản phẩm "${productId}" không tồn tại trong hệ thống`, 404);
    }

    throw new AppError(`Không thể kết nối đến Product Service: ${error.message}`, 503);
  }
};

const getToppingById = async (toppingId) => {
  try {
    const response = await axios.get(`${TOPPING_SERVICE_URL}/${toppingId}`);
    const topping = response.data.data;

    if (!topping) {
      throw new AppError(`Topping "${toppingId}" không tồn tại`, 404);
    }

    if (topping.status !== 'ACTIVE' || !topping.isAvailable) {
      throw new AppError(`Topping "${topping.toppingName}" hiện không khả dụng`, 400);
    }

    return topping;
  } catch (error) {
    if (error instanceof AppError) throw error;

    if (error.response && error.response.status === 404) {
      throw new AppError(`Topping "${toppingId}" không tồn tại`, 404);
    }

    throw new AppError(`Không thể kết nối đến Product Service: ${error.message}`, 503);
  }
};

module.exports = { getProductById, getToppingById };