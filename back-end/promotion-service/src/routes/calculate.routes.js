const express = require('express');
const router = express.Router();
const calculateController = require('../controllers/calculate.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// POST /api/promotions/calculate — preview, không cần đăng nhập
router.post('/calculate', calculateController.calculate);

// POST /api/promotions/use — ghi nhận sau khi đơn được tạo (cần đăng nhập)
router.post('/use', authMiddleware, calculateController.use);

// GET /api/promotions/usage/:programId — lịch sử dùng (manager)
router.get('/usage/:programId', authMiddleware, authorizeMiddleware('MANAGER'), calculateController.getUsageHistory);

module.exports = router;
