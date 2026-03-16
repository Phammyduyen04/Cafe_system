require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorHandler } = require('shared');
const discountRoutes = require('./routes/discount.routes');
const promotionRoutes = require('./routes/promotion.routes');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB - Promotion DB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Promotion Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/discounts', discountRoutes);
app.use('/api/promotions', promotionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Promotion Service is running on port ${PORT}`);
});
