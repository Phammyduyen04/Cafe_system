require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Service proxy config
const services = [
  {
    route: '/api/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  {
    route: '/api/customers',
    target: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002',
  },
  {
    route: '/api/orders',
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  },
  {
    route: '/api/payments',
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  },
  {
    route: '/api/products',
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3005',
  },
  {
    route: '/api/promotions',
    target: process.env.PROMOTION_SERVICE_URL || 'http://localhost:3006',
  },
  {
    route: '/api/staff',
    target: process.env.STAFF_SERVICE_URL || 'http://localhost:3007',
  },
];

// Setup proxy for each service
services.forEach(({ route, target }) => {
  app.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${route}`]: '/api',
      },
      on: {
        proxyReq: (proxyReq, req) => {
          // Forward authorization header
          if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
          }
        },
        error: (err, req, res) => {
          console.error(`Proxy error for ${route}:`, err.message);
          res.status(502).json({
            success: false,
            message: `Service unavailable: ${route}`,
          });
        },
      },
    })
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
  console.log('Service routes:');
  services.forEach(({ route, target }) => {
    console.log(`  ${route} -> ${target}`);
  });
});
