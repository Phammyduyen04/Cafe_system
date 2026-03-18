require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, subscriber } = require('../../shared');
const customerRoutes = require('./routes/customer.routes');
const customerService = require('./services/customer.service');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Customer Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/customers', customerRoutes);

app.use(errorHandler);

// Subscribe to order events
const setupEventSubscribers = async () => {
  try {
    await subscriber.subscribe('order_exchange', 'customer_order_completed', 'order.completed', async (message) => {
      const { customerId, orderId, totalAmount } = message;
      // Cộng điểm: 1 điểm cho mỗi 10,000 VND
      const pointsEarned = Math.floor(totalAmount / 10000);
      if (pointsEarned > 0 && customerId) {
        await customerService.addPoints(customerId, pointsEarned, 'EARN', `Order #${orderId} completed`, orderId);
      }
    });
  } catch (error) {
    console.error('Failed to setup event subscribers:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Customer Service is running on port ${PORT}`);
  setupEventSubscribers();
});
