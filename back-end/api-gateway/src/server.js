require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const proxy = require('express-http-proxy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Service URLs
const AUTH_URL      = process.env.AUTH_SERVICE_URL      || 'http://localhost:3001';
const CUSTOMER_URL  = process.env.CUSTOMER_SERVICE_URL  || 'http://localhost:3002';
const ORDER_URL     = process.env.ORDER_SERVICE_URL      || 'http://localhost:3003';
const PAYMENT_URL   = process.env.PAYMENT_SERVICE_URL   || 'http://localhost:3004';
const PRODUCT_URL   = process.env.PRODUCT_SERVICE_URL   || 'http://localhost:3005';
const PROMOTION_URL = process.env.PROMOTION_SERVICE_URL || 'http://localhost:3006';
const STAFF_URL     = process.env.STAFF_SERVICE_URL      || 'http://localhost:3007';

// Proxy options: forward Authorization header + preserve full path
const proxyOptions = {
  proxyReqPathResolver(req) {
    return req.originalUrl;
  },
  proxyReqOptDecorator(proxyReqOpts, srcReq) {
    if (srcReq.headers.authorization) {
      proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    }
    return proxyReqOpts;
  },
  proxyErrorHandler(err, res, next) {
    console.error('Proxy error:', err.message);
    res.status(502).json({ success: false, message: 'Service unavailable' });
  },
  parseReqBody: false,  // Required for file upload (multipart/form-data) to pass through correctly
};

// Routes — proxyReqPathResolver giữ nguyên path gốc (vd: /api/payments/:id)
app.use('/api/auth',       proxy(AUTH_URL,      proxyOptions));
app.use('/api/customers',  proxy(CUSTOMER_URL,  proxyOptions));
app.use('/api/orders',     proxy(ORDER_URL,     proxyOptions));
app.use('/api/payments',   proxy(PAYMENT_URL,   proxyOptions));
app.use('/api/products',   proxy(PRODUCT_URL,   proxyOptions));
app.use('/uploads',        proxy(PRODUCT_URL,   {
  proxyReqPathResolver(req) { return req.originalUrl; },
  proxyErrorHandler(err, res, next) {
    console.error('Proxy error:', err.message);
    res.status(502).json({ success: false, message: 'Service unavailable' });
  },
}));
app.use('/api/promotions', proxy(PROMOTION_URL, proxyOptions));
app.use('/api/staff',      proxy(STAFF_URL,     proxyOptions));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  /api/auth       -> ${AUTH_URL}`);
  console.log(`  /api/customers  -> ${CUSTOMER_URL}`);
  console.log(`  /api/orders     -> ${ORDER_URL}`);
  console.log(`  /api/payments   -> ${PAYMENT_URL}`);
  console.log(`  /api/products   -> ${PRODUCT_URL}`);
  console.log(`  /api/promotions -> ${PROMOTION_URL}`);
  console.log(`  /api/staff      -> ${STAFF_URL}`);
});
