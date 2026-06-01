const { AppError } = require('../../../shared');
const cartRepo = require('../repositories/cart.repo');
const { getProductById, getToppingById } = require('./product.client');

// ========== Ràng buộc nghiệp vụ ==========
const VALID_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
const MAX_QUANTITY = 200;

/**
 * Validate thông tin item trước khi thêm/cập nhật
 */
const validateItemData = (data) => {
  // Validate quantity
  if (data.quantity !== undefined) {
    if (!Number.isInteger(data.quantity) || data.quantity < 1) {
      throw new AppError('Số lượng phải là số nguyên >= 1', 400);
    }
    if (data.quantity > MAX_QUANTITY) {
      throw new AppError(`Số lượng không được vượt quá ${MAX_QUANTITY}`, 400);
    }
  }

  // Validate size — accept any non-empty string (product sizes are dynamic)
  if (data.size !== undefined && data.size !== null && data.size !== '') {
    if (typeof data.size !== 'string' || data.size.length > 20) {
      throw new AppError('Size không hợp lệ', 400);
    }
  }

  // Validate sugarLevel
  if (data.sugarLevel !== undefined && data.sugarLevel !== null) {
    if (!VALID_LEVELS.includes(data.sugarLevel)) {
      throw new AppError(`Mức đường chỉ được chọn: ${VALID_LEVELS.join(', ')}`, 400);
    }
  }

  // Validate iceLevel
  if (data.iceLevel !== undefined && data.iceLevel !== null) {
    if (!VALID_LEVELS.includes(data.iceLevel)) {
      throw new AppError(`Mức đá chỉ được chọn: ${VALID_LEVELS.join(', ')}`, 400);
    }
  }

  // Validate toppings (chỉ kiểm tra quantity, toppingId được resolve riêng)
  if (data.toppings && Array.isArray(data.toppings)) {
    data.toppings.forEach((t, index) => {
      if (!t.toppingId) {
        throw new AppError(`Topping #${index + 1}: toppingId là bắt buộc`, 400);
      }
      if (t.quantity !== undefined) {
        if (!Number.isInteger(t.quantity) || t.quantity < 1) {
          throw new AppError(`Topping #${index + 1}: số lượng phải là số nguyên >= 1`, 400);
        }
        if (t.quantity > MAX_QUANTITY) {
          throw new AppError(`Topping #${index + 1}: số lượng không được vượt quá ${MAX_QUANTITY}`, 400);
        }
      }
    });
  }
};

const getCart = async (customerId) => {
  const cart = await cartRepo.getOrCreateCart(customerId);
  return cart;
};

const addToCart = async (customerId, itemData) => {
  if (!itemData.productId) {
    throw new AppError('productId is required', 400);
  }

  // Xác minh sản phẩm tồn tại và lấy thông tin từ product-service
  const product = await getProductById(itemData.productId);
  itemData.productName = product.productName;
  // Dùng unitPrice từ client nếu có (đã tính phụ phí size), fallback về giá gốc
  itemData.unitPrice = itemData.unitPrice ?? product.price;

  // Áp dụng mặc định và validate
  itemData.sugarLevel = itemData.sugarLevel || '100%';
  itemData.iceLevel = itemData.iceLevel || '100%';
  itemData.quantity = itemData.quantity || 1;
  validateItemData(itemData);

  // Resolve toppings: lấy tên + giá từ product-service theo toppingId
  if (itemData.toppings && itemData.toppings.length > 0) {
    itemData.toppings = await Promise.all(
      itemData.toppings.map(async (t) => {
        const topping = await getToppingById(t.toppingId);
        return {
          toppingId: topping.toppingId,
          toppingName: topping.toppingName,
          toppingPrice: topping.price,
          quantity: t.quantity || 1,
        };
      })
    );
  }

  const cart = await cartRepo.getOrCreateCart(customerId);
  await cartRepo.addItem(cart.cart_id, itemData);

  return await cartRepo.findByCustomerId(customerId);
};

/**
 * Cập nhật item trong giỏ hàng
 * Hỗ trợ cập nhật: quantity, size, sugarLevel, iceLevel, itemNote, toppings
 */
const updateCartItem = async (customerId, cartItemId, updateData) => {
  validateItemData(updateData);

  const cart = await cartRepo.findByCustomerId(customerId);
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.find((i) => i.cart_item_id === cartItemId);
  if (!item) throw new AppError('Item not found in cart', 404);

  // Resolve toppings nếu có cập nhật
  if (updateData.toppings && updateData.toppings.length > 0) {
    updateData.toppings = await Promise.all(
      updateData.toppings.map(async (t) => {
        const topping = await getToppingById(t.toppingId);
        return {
          toppingId: topping.toppingId,
          toppingName: topping.toppingName,
          toppingPrice: topping.price,
          quantity: t.quantity || 1,
        };
      })
    );
  }

  await cartRepo.updateItem(cartItemId, updateData);
  return await cartRepo.findByCustomerId(customerId);
};

const removeFromCart = async (customerId, cartItemId) => {
  const cart = await cartRepo.findByCustomerId(customerId);
  if (!cart) throw new AppError('Cart not found', 404);

  const item = cart.items.find((i) => i.cart_item_id === cartItemId);
  if (!item) throw new AppError('Item not found in cart', 404);

  await cartRepo.removeItem(cartItemId);
  return await cartRepo.findByCustomerId(customerId);
};

const clearCart = async (customerId) => {
  const cart = await cartRepo.findByCustomerId(customerId);
  if (!cart) throw new AppError('Cart not found', 404);

  await cartRepo.clearCart(cart.cart_id);
  return await cartRepo.findByCustomerId(customerId);
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };