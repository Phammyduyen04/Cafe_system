const { AppError, publisher } = require('shared');
const orderRepo = require('../repositories/order.repo');
const crypto = require('crypto');

/**
 * Tạo mã đơn hàng duy nhất
 */
const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Tạo đơn hàng mới
 * @param {object} data - Dữ liệu đơn hàng
 * @param {object} user - User từ JWT
 */
const createOrder = async (data, user) => {
  const {
    customerId,
    orderType = 'DINE_IN',
    items,
    note,
    discounts = [],
    promotions = [],
  } = data;

  if (!items || items.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }

  // Tính subtotal
  let subtotalAmount = 0;
  const orderDetails = items.map((item) => {
    const lineTotal = item.unitPrice * item.quantity;
    subtotalAmount += lineTotal;

    return {
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      item_note: item.itemNote || null,
      line_total: lineTotal,
      toppings: {
        create: (item.toppings || []).map((t) => {
          const toppingTotal = t.toppingPrice * (t.quantity || 1);
          subtotalAmount += toppingTotal;
          return {
            topping_name: t.toppingName,
            topping_price: t.toppingPrice,
            quantity: t.quantity || 1,
          };
        }),
      },
    };
  });

  // Tính discount
  let discountAmount = 0;
  const orderDiscounts = discounts.map((d) => {
    discountAmount += d.appliedAmount || 0;
    return {
      discount_id: d.discountId,
      discount_name: d.discountName,
      discount_type: d.discountType,
      discount_value: d.discountValue,
      applied_amount: d.appliedAmount || 0,
    };
  });

  // Tính promotion
  let promotionAmount = 0;
  const orderPromotions = promotions.map((p) => {
    promotionAmount += p.appliedAmount || 0;
    return {
      promotion_id: p.promotionId,
      promotion_name: p.promotionName,
      benefit_type: p.benefitType,
      benefit_value: p.benefitValue,
      applied_amount: p.appliedAmount || 0,
    };
  });

  const totalAmount = subtotalAmount - discountAmount - promotionAmount;

  const order = await orderRepo.create({
    customer_id: customerId || null,
    order_code: generateOrderCode(),
    order_type: orderType,
    subtotal_amount: subtotalAmount,
    discount_amount: discountAmount,
    promotion_amount: promotionAmount,
    total_amount: totalAmount > 0 ? totalAmount : 0,
    note: note || null,
    created_by: user.username,
    order_details: { create: orderDetails },
    order_discounts: { create: orderDiscounts },
    order_promotions: { create: orderPromotions },
    status_logs: {
      create: {
        old_status: null,
        new_status: 'PENDING',
        changed_by: user.username,
        note: 'Order created',
      },
    },
  });

  // Publish event
  await publisher.publish('order_exchange', 'order.created', {
    orderId: order.order_id,
    orderCode: order.order_code,
    customerId: order.customer_id,
    totalAmount: Number(order.total_amount),
    createdBy: user.username,
  });

  return order;
};

const getAllOrders = async (page, limit, filters) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customer_id = filters.customerId;

  const [orders, total] = await Promise.all([
    orderRepo.findMany(where, skip, limit),
    orderRepo.count(where),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getOrderById = async (id) => {
  const order = await orderRepo.findById(id);
  if (!order) throw new AppError('Order not found', 404);
  return order;
};

const updateOrderStatus = async (id, newStatus, user, note) => {
  const order = await orderRepo.findById(id);
  if (!order) throw new AppError('Order not found', 404);

  const validTransitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`Cannot transition from ${order.status} to ${newStatus}`, 400);
  }

  const updated = await orderRepo.updateStatus(id, newStatus, {
    old_status: order.status,
    new_status: newStatus,
    changed_by: user.username,
    note: note || null,
  });

  // Publish event khi hoàn thành
  if (newStatus === 'COMPLETED') {
    await publisher.publish('order_exchange', 'order.completed', {
      orderId: order.order_id,
      orderCode: order.order_code,
      customerId: order.customer_id,
      totalAmount: Number(order.total_amount),
    });
  }

  return updated;
};

const getOrderStatusLogs = async (orderId) => {
  return await orderRepo.getStatusLogs(orderId);
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, getOrderStatusLogs };
