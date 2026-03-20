const prisma = require('../models/prisma');

const findByCustomerId = async (customerId) => {
  return await prisma.cart.findUnique({
    where: { customer_id: customerId },
    include: {
      items: {
        include: { toppings: true },
        orderBy: { created_at: 'desc' },
      },
    },
  });
};

const getOrCreateCart = async (customerId) => {
  let cart = await findByCustomerId(customerId);
  if (!cart) {
    cart = await prisma.cart.create({
      data: { customer_id: customerId },
      include: { items: { include: { toppings: true } } },
    });
  }
  return cart;
};

const addItem = async (cartId, itemData) => {
  return await prisma.cartItem.create({
    data: {
      cart_id: cartId,
      product_id: itemData.productId,
      product_name: itemData.productName,
      size: itemData.size || null,
      sugar_level: itemData.sugarLevel || null,
      ice_level: itemData.iceLevel || null,
      unit_price: itemData.unitPrice,
      quantity: itemData.quantity || 1,
      item_note: itemData.itemNote || null,
      toppings: {
        create: (itemData.toppings || []).map((t) => ({
          topping_id: t.toppingId,
          topping_name: t.toppingName,
          topping_price: t.toppingPrice,
          quantity: t.quantity || 1,
        })),
      },
    },
    include: { toppings: true },
  });
};

const updateItemQuantity = async (cartItemId, quantity) => {
  return await prisma.cartItem.update({
    where: { cart_item_id: cartItemId },
    data: { quantity },
    include: { toppings: true },
  });
};

/**
 * Cập nhật item trong giỏ hàng (quantity, size, sugar, ice, note, toppings)
 * Nếu có toppings mới → xóa toppings cũ và tạo lại
 */
const updateItem = async (cartItemId, updateData) => {
  const data = {};

  if (updateData.quantity !== undefined) data.quantity = updateData.quantity;
  if (updateData.size !== undefined) data.size = updateData.size;
  if (updateData.sugarLevel !== undefined) data.sugar_level = updateData.sugarLevel;
  if (updateData.iceLevel !== undefined) data.ice_level = updateData.iceLevel;
  if (updateData.itemNote !== undefined) data.item_note = updateData.itemNote;

  // Nếu có cập nhật toppings → xóa cũ, tạo mới
  if (updateData.toppings !== undefined) {
    await prisma.cartItemTopping.deleteMany({
      where: { cart_item_id: cartItemId },
    });

    if (updateData.toppings.length > 0) {
      data.toppings = {
        create: updateData.toppings.map((t) => ({
          topping_id: t.toppingId,
          topping_name: t.toppingName,
          topping_price: t.toppingPrice,
          quantity: t.quantity || 1,
        })),
      };
    }
  }

  return await prisma.cartItem.update({
    where: { cart_item_id: cartItemId },
    data,
    include: { toppings: true },
  });
};

const removeItem = async (cartItemId) => {
  return await prisma.cartItem.delete({
    where: { cart_item_id: cartItemId },
  });
};

const clearCart = async (cartId) => {
  return await prisma.cartItem.deleteMany({
    where: { cart_id: cartId },
  });
};

module.exports = {
  findByCustomerId,
  getOrCreateCart,
  addItem,
  updateItemQuantity,
  updateItem,
  removeItem,
  clearCart,
};
