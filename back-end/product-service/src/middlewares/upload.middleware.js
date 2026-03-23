const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function createStorage(folder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../uploads', folder));
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

const uploadProduct = multer({ storage: createStorage('products'), fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadTopping = multer({ storage: createStorage('toppings'), fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadProduct, uploadTopping };
