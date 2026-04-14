const express = require('express');
const router = express.Router();
const { authMiddleware, authorizeMiddleware } = require('../../../shared');
const { uploadPromotion, uploadDiscount } = require('../middlewares/upload.middleware');

function handleUpload(uploader, folder) {
  return (req, res) => {
    uploader.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File quá lớn, tối đa 5MB' });
        }
        return res.status(400).json({ success: false, message: err.message || 'Lỗi upload file' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không có file được upload' });
      }
      const url = `/uploads/${folder}/${req.file.filename}`;
      return res.status(200).json({ success: true, data: { url } });
    });
  };
}

// POST /api/promotions/upload/promotion
router.post(
  '/promotion',
  authMiddleware,
  authorizeMiddleware('MANAGER'),
  handleUpload(uploadPromotion, 'promotions')
);

// POST /api/promotions/upload/discount
router.post(
  '/discount',
  authMiddleware,
  authorizeMiddleware('MANAGER'),
  handleUpload(uploadDiscount, 'discounts')
);

module.exports = router;
