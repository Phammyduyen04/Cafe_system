const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function createStorage(folder) {
  const dest = path.join(__dirname, '../../uploads', folder);
  // Tự tạo thư mục nếu chưa tồn tại (đảm bảo hoạt động sau mỗi lần restart container)
  fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = crypto.randomUUID();
      cb(null, `${name}${ext}`);
    },
  });
}

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, webp, gif)'));
  }
}

const uploadPromotion = multer({ storage: createStorage('promotions'), fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadDiscount  = multer({ storage: createStorage('discounts'),  fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadPromotion, uploadDiscount };
