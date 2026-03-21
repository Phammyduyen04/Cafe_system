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

// Internal API (không cần auth, chỉ dùng giữa các service)
app.post('/internal/create-from-account', async (req, res) => {
  try {
    const customer = await customerService.createCustomerFromAccount(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error('Internal create-from-account error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use(errorHandler);

// Subscribe to events
const setupEventSubscribers = async () => {
  try {
    // Cộng điểm khi đơn hàng hoàn thành
    await subscriber.subscribe('order_exchange', 'customer_order_completed', 'order.completed', async (message) => {
      const { customerId, orderId, totalAmount } = message;
      const pointsEarned = Math.floor(totalAmount / 10000);
      if (pointsEarned > 0 && customerId) {
        await customerService.addPoints(customerId, pointsEarned, 'EARN', `Order #${orderId} completed`, orderId);
      }
    });

    // Tự động tạo customer profile khi tài khoản CUSTOMER được đăng ký
    await subscriber.subscribe('auth_exchange', 'customer_account_created', 'account.created', async (message) => {
      await customerService.createCustomerFromAccount(message);
    });
  } catch (error) {
    console.error('Failed to setup event subscribers:', error.message);
  }
};

app.listen(PORT, () => {
  console.log(`Customer Service is running on port ${PORT}`);
  setupEventSubscribers();
});
