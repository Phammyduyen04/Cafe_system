const { AppError, publisher } = require('../../../shared');
const orderRepo = require('../repositories/order.repo');
const cartRepo = require('../repositories/cart.repo');
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
 * Build order details từ danh sách items
 */
const buildOrderDetails = (items) => {
  let subtotalAmount = 0;
  const orderDetails = items.map((item) => {
    const lineTotal = item.unitPrice * item.quantity;
    subtotalAmount += lineTotal;

    return {
      product_id: item.productId,
      product_name: item.productName,
      size: item.size || null,
      sugar_level: item.sugarLevel || null,
      ice_level: item.iceLevel || null,
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

  return { orderDetails, subtotalAmount };
};

/**
 * Tạo đơn hàng mới (dùng chung cho cả ONLINE và IN_STORE)
 * - ONLINE: khách hàng tự đặt, trạng thái ban đầu = PENDING
 * - IN_STORE: nhân viên tạo tại quầy, trạng thái ban đầu = CONFIRMED
 * @param {object} data - Dữ liệu đơn hàng
 * @param {object} user - User từ JWT
 */
const createOrder = async (data, user) => {
  const {
    customerId,
    orderType = 'DINE_IN',
    orderChannel = 'IN_STORE',
    items,
    note,
    discounts = [],
    promotions = [],
  } = data;

  if (!items || items.length === 0) {
    throw new AppError('Order must have at least one item', 400);
  }

  // Build order details và tính subtotal
  const { orderDetails, subtotalAmount } = buildOrderDetails(items);

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

  // Xác định trạng thái ban đầu dựa vào kênh đặt hàng
  const initialStatus = orderChannel === 'ONLINE' ? 'PENDING' : 'CONFIRMED';
  const statusNote = orderChannel === 'ONLINE'
    ? 'Khách hàng đặt đơn online'
    : 'Nhân viên tạo đơn tại quầy';

  const order = await orderRepo.create({
    customer_id: customerId || null,
    order_code: generateOrderCode(),
    order_type: orderType,
    order_channel: orderChannel,
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
        new_status: initialStatus,
        changed_by: user.username,
        note: statusNote,
      },
    },
  });

  // Publish event
  await publisher.publish('order_exchange', 'order.created', {
    orderId: order.order_id,
    orderCode: order.order_code,
    orderChannel: order.order_channel,
    customerId: order.customer_id,
    totalAmount: Number(order.total_amount),
    createdBy: user.username,
  });

  return order;
};

/**
 * Khách hàng đặt đơn online từ giỏ hàng
 * Lấy items từ cart, tạo order với channel = ONLINE, sau đó xóa cart
 */
const createOrderFromCart = async (data, user) => {
  const customerId = user.userId || user.accountId;
  const cart = await cartRepo.findByCustomerId(customerId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Chuyển cart items sang order items format
  const items = cart.items.map((item) => ({
    productId: item.product_id,
    productName: item.product_name,
    size: item.size,
    sugarLevel: item.sugar_level,
    iceLevel: item.ice_level,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    itemNote: item.item_note,
    toppings: item.toppings.map((t) => ({
      toppingName: t.topping_name,
      toppingPrice: Number(t.topping_price),
      quantity: t.quantity,
    })),
  }));

  const orderData = {
    customerId: customerId,
    orderType: data.orderType || 'TAKE_AWAY',
    orderChannel: 'ONLINE',
    items,
    note: data.note || null,
    discounts: data.discounts || [],
    promotions: data.promotions || [],
  };

  const order = await createOrder(orderData, user);

  // Xóa giỏ hàng sau khi đặt đơn thành công
  await cartRepo.clearCart(cart.cart_id);

  return order;
};

const getAllOrders = async (page, limit, filters) => {
  const skip = (page - 1) * limit;
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customer_id = filters.customerId;
  if (filters.orderChannel) where.order_channel = filters.orderChannel;

  const [orders, total] = await Promise.all([
    orderRepo.findMany(where, skip, limit),
    orderRepo.count(where),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Lấy danh sách đơn hàng của khách hàng (chỉ đơn của chính họ)
 */
const getMyOrders = async (customerId, page, limit) => {
  return await getAllOrders(page, limit, { customerId });
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

/**
 * Khách hàng hủy đơn hàng online (chỉ khi đơn ở trạng thái PENDING)
 */
const cancelMyOrder = async (orderId, user) => {
  const order = await orderRepo.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  const customerId = user.userId || user.accountId;
  if (order.customer_id !== customerId) {
    throw new AppError('You can only cancel your own orders', 403);
  }

  if (order.status !== 'PENDING') {
    throw new AppError('Only pending orders can be cancelled', 400);
  }

  return await orderRepo.updateStatus(orderId, 'CANCELLED', {
    old_status: order.status,
    new_status: 'CANCELLED',
    changed_by: user.username,
    note: 'Khách hàng hủy đơn hàng',
  });
};

const getOrderStatusLogs = async (orderId) => {
  return await orderRepo.getStatusLogs(orderId);
};

module.exports = {
  createOrder,
  createOrderFromCart,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
  getOrderStatusLogs,
};