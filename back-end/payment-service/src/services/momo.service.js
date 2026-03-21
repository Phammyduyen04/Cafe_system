const crypto = require('crypto');
const axios = require('axios');

const {
  MOMO_PARTNER_CODE,
  MOMO_ACCESS_KEY,
  MOMO_SECRET_KEY,
  MOMO_API_URL,
  MOMO_REDIRECT_URL,
  MOMO_IPN_URL,
} = process.env;

/**
 * Tạo yêu cầu thanh toán MoMo (môi trường test)
 * Tài liệu: https://developers.momo.vn/v3/docs/payment/api/payment-api
 *
 * @param {object} params
 * @param {string} params.momoOrderId  - ID đơn hàng gửi lên MoMo (= provider_order_id của ta)
 * @param {number} params.amount       - Số tiền (VNĐ, nguyên)
 * @param {string} params.orderInfo    - Mô tả đơn hàng hiển thị cho người dùng
 * @param {string} params.requestId    - requestId duy nhất (= momoOrderId)
 */
const createMomoPayment = async ({ momoOrderId, amount, orderInfo, requestId }) => {
  const partnerCode = MOMO_PARTNER_CODE;
  const accessKey = MOMO_ACCESS_KEY;
  const secretKey = MOMO_SECRET_KEY;
  const redirectUrl = MOMO_REDIRECT_URL;
  const ipnUrl = MOMO_IPN_URL;
  const requestType = 'payWithMethod';
  const extraData = '';
  const lang = 'vi';

  // Tạo chữ ký HMAC-SHA256
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${momoOrderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${redirectUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang,
  };

  const response = await axios.post(MOMO_API_URL, body, { timeout: 10000 });
  return response.data;
};

/**
 * Xác thực chữ ký IPN callback từ MoMo
 * MoMo gửi callback khi thanh toán hoàn thành/thất bại
 */
const verifyMomoCallback = (data) => {
  const secretKey = MOMO_SECRET_KEY;
  const accessKey = MOMO_ACCESS_KEY;

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${data.amount}`,
    `extraData=${data.extraData}`,
    `message=${data.message}`,
    `orderId=${data.orderId}`,
    `orderInfo=${data.orderInfo}`,
    `orderType=${data.orderType}`,
    `partnerCode=${data.partnerCode}`,
    `payType=${data.payType}`,
    `requestId=${data.requestId}`,
    `responseTime=${data.responseTime}`,
    `resultCode=${data.resultCode}`,
    `transId=${data.transId}`,
  ].join('&');

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  return expectedSignature === data.signature;
};

module.exports = { createMomoPayment, verifyMomoCallback };
