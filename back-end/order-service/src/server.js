require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../shared');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Order Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/orders', orderRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Order Service is running on port ${PORT}`);
});