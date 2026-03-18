require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { errorHandler } = require('../../../shared');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const ingredientRoutes = require('./routes/ingredient.routes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB - Product DB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Product Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/ingredients', ingredientRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Product Service is running on port ${PORT}`);
});
