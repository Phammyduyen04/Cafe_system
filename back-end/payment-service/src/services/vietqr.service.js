/**
 * VietQR - Tạo URL ảnh QR chuyển khoản ngân hàng
 * Sử dụng VietQR public image API (không cần API key)
 * Tài liệu: https://vietqr.io/danh-sach-api/tao-ma-qr
 *
 * Template compact2: hiển thị gọn, phù hợp quét nhanh tại quán
 */
const generateVietQRUrl = ({ amount, orderCode }) => {
  const bankId = process.env.VIETQR_BANK_ID;
  const accountNumber = process.env.VIETQR_ACCOUNT_NUMBER;
  const accountName = process.env.VIETQR_ACCOUNT_NAME || '';
  const template = 'compact2';

  const addInfo = encodeURIComponent(`Thanh toan ${orderCode}`);
  const name = encodeURIComponent(accountName);

  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-${template}.jpg?amount=${amount}&addInfo=${addInfo}&accountName=${name}`;
};

module.exports = { generateVietQRUrl };
