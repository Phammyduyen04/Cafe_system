const authMiddleware = require('./auth.middleware');
const authorizeMiddleware = require('./authorize.middleware');
const optionalAuthMiddleware = require('./optionalAuth.middleware');

module.exports = {
  authMiddleware,
  authorizeMiddleware,
  optionalAuthMiddleware,
};
