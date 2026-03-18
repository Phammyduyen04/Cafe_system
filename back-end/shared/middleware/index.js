const authMiddleware = require('./auth.middleware');
const authorizeMiddleware = require('./authorize.middleware');

module.exports = {
  authMiddleware,
  authorizeMiddleware,
};
