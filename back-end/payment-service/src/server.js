require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, subscriber } = require('../../shared');
const paymentRoutes = require('./routes/payment.routes');
const paymentService = require('./services/payment.service');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Payment Service is running', timestamp: new Date().toISOString() });
});

app.use('/', paymentRoutes);

app.use(errorHandler);

// Subscribe to order events
const setupEventSubscribers = async () => {
  try {
    await subscriber.subscribe('order_exchange', 'payment_order_created', 'order.created', async (message) => {
      const { orderId, totalAmount } = message;
      await paymentService.createPaymentFromOrder(orderId, totalAmount);
    });
  } catch (error) {
    console.error('Failed to setup event subscribers:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Payment Service is running on port ${PORT}`);
  setupEventSubscribers();
});
