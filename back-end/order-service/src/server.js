require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, subscriber } = require('../../shared');
const orderRoutes    = require('./routes/order.routes');
const shippingRoutes = require('./routes/shipping.routes');
const orderService = require('./services/order.service');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Order Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/orders',   orderRoutes);
app.use('/api/shipping', shippingRoutes);

app.use(errorHandler);

const setupEventSubscribers = async () => {
  try {
    // Nhận sự kiện thanh toán hoàn tất từ payment-service → cập nhật PENDING_PAYMENT → PAID
    await subscriber.subscribe('payment_exchange', 'order_payment_completed', 'payment.completed', async (message) => {
      const { orderId } = message;
      await orderService.paymentConfirmed(orderId);
    });
  } catch (error) {
    console.error('[order-service] Failed to setup event subscribers:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Order Service is running on port ${PORT}`);
  setupEventSubscribers();
});