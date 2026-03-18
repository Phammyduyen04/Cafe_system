/**
 * Middleware phân quyền - kiểm tra role của user
 * Sử dụng sau authMiddleware để đảm bảo req.user đã tồn tại
 * @param  {...string} allowedRoles - Danh sách role được phép truy cập
 */
const authorizeMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const userRoles = req.user.roles || [];

    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
      });
    }

    next();
  };
};

module.exports = authorizeMiddleware;
