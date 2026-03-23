require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const { errorHandler } = require('../../shared');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const ingredientRoutes = require('./routes/ingredient.routes');
const toppingRoutes = require('./routes/topping.routes');
const reviewRoutes = require('./routes/review.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB - Product DB'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Product Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/products/upload', uploadRoutes);
app.use('/api/products/categories', categoryRoutes);
app.use('/api/products/ingredients', ingredientRoutes);
app.use('/api/products/toppings', toppingRoutes);
app.use('/api/products/reviews', reviewRoutes);
app.use('/api/products', productRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Product Service is running on port ${PORT}`);
});
