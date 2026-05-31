const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'coffee_shop_secret_key_2026';

const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    }
  } catch (_) {
    // token không hợp lệ → bỏ qua, tiếp tục như anonymous
  }
  next();
};

module.exports = optionalAuthMiddleware;
