const { VNPay, ProductCode, VnpLocale, HashAlgorithm } = require('vnpay');

const vnpay = new VNPay({
  tmnCode:       process.env.VNPAY_TMN_CODE,
  secureSecret:  process.env.VNPAY_HASH_SECRET,
  vnpayHost:     'https://sandbox.vnpayment.vn',
  testMode:      true,
  hashAlgorithm: HashAlgorithm.SHA512,
});

const VNP_RETURN_URL = process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-result';

/**
 * Tạo URL thanh toán VNPay
 */
function createPaymentUrl({ amount, orderCode, orderInfo, ipAddr = '127.0.0.1' }) {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000); // UTC+7
  const fmt  = (d) => d.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const createDate = Number(fmt(now));
  const expireDate = Number(fmt(new Date(now.getTime() + 15 * 60 * 1000)));

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount:     amount,
    vnp_IpAddr:     ipAddr,
    vnp_TxnRef:     orderCode,
    vnp_OrderInfo:  orderInfo || `Thanh toan ${orderCode}`,
    vnp_OrderType:  ProductCode.Other,
    vnp_ReturnUrl:  VNP_RETURN_URL,
    vnp_Locale:     VnpLocale.VN,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  });

  return paymentUrl;
}

/**
 * Xác minh chữ ký từ VNPay IPN / Return URL
 */
function verifyCallback(query) {
  try {
    const result = vnpay.verifyReturnUrl(query);
    return result.isVerified;
  } catch {
    return false;
  }
}

module.exports = { createPaymentUrl, verifyCallback };
