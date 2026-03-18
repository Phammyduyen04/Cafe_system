require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../shared');
const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/role.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Auth Service is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/', authRoutes);
app.use('/roles', roleRoutes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
