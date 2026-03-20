const cartService = require('../services/cart.service');
const { responseHelper, AppError } = require('../../../shared');

/**
 * Lấy customerId từ JWT token
 * Ưu tiên userId, fallback sang accountId
 */
const getCustomerId = (user) => {
  const customerId = user.userId || user.accountId;
  if (!customerId) {
    throw new AppError('Customer ID not found in token', 400);
  }
  return customerId;
};

const getCart = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req.user);
    const cart = await cartService.getCart(customerId);
    return responseHelper.success(res, cart);
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req.user);
    const cart = await cartService.addToCart(customerId, req.body);
    return responseHelper.success(res, cart, 'Item added to cart');
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req.user);
    const cart = await cartService.updateCartItem(customerId, req.params.itemId, req.body);
    return responseHelper.success(res, cart, 'Cart item updated');
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req.user);
    const cart = await cartService.removeFromCart(customerId, req.params.itemId);
    return responseHelper.success(res, cart, 'Item removed from cart');
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const customerId = getCustomerId(req.user);
    const cart = await cartService.clearCart(customerId);
    return responseHelper.success(res, cart, 'Cart cleared');
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
