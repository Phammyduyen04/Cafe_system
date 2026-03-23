const express = require('express');
const router = express.Router();
const { uploadProduct, uploadTopping, uploadIngredient } = require('../middlewares/upload.middleware');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

// POST /api/products/upload/product  — upload 1 ảnh sản phẩm
router.post(
  '/product',
  authMiddleware,
  authorizeMiddleware('ADMIN', 'MANAGER'),
  uploadProduct.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file được gửi lên' });
    const url = `/uploads/products/${req.file.filename}`;
    return res.status(201).json({ url });
  }
);

// POST /api/products/upload/topping  — upload 1 ảnh topping
router.post(
  '/topping',
  authMiddleware,
  authorizeMiddleware('ADMIN', 'MANAGER'),
  uploadTopping.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file được gửi lên' });
    const url = `/uploads/toppings/${req.file.filename}`;
    return res.status(201).json({ url });
  }
);

// POST /api/products/upload/ingredient  — upload 1 ảnh nguyên liệu
router.post(
  '/ingredient',
  authMiddleware,
  authorizeMiddleware('ADMIN', 'MANAGER'),
  uploadIngredient.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file được gửi lên' });
    const url = `/uploads/ingredients/${req.file.filename}`;
    return res.status(201).json({ url });
  }
);

module.exports = router;
