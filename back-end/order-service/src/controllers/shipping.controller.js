const axios = require('axios');

const AHAMOVE_API   = process.env.AHAMOVE_API_URL  || 'https://apistg.ahamove.com';
const STORE_LAT     = parseFloat(process.env.STORE_LAT     || '10.8414');
const STORE_LNG     = parseFloat(process.env.STORE_LNG     || '106.8098');
const STORE_ADDRESS = process.env.STORE_ADDRESS || 'Coffea Cafe, TP. Hồ Chí Minh';
const STORE_PHONE   = process.env.STORE_PHONE   || '+84901234567';

// Cache token in memory — valid ~22 h (Ahamove token TTL is 24 h)
let _cachedToken    = null;
let _tokenFetchedAt = 0;
const TOKEN_TTL_MS  = 22 * 60 * 60 * 1000;

async function getAhamoveToken() {
  const directToken = process.env.AHAMOVE_TOKEN;
  if (directToken) return directToken;

  const apiKey = process.env.AHAMOVE_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình AHAMOVE_TOKEN hoặc AHAMOVE_API_KEY trong .env');

  if (_cachedToken && Date.now() - _tokenFetchedAt < TOKEN_TTL_MS) {
    return _cachedToken;
  }

  const { data } = await axios.post(`${AHAMOVE_API}/v1/partner/login`, {
    api_key: apiKey,
    mobile:  STORE_PHONE,
    name:    'Coffea',
  });

  _cachedToken    = data.token;
  _tokenFetchedAt = Date.now();
  return _cachedToken;
}

/**
 * POST /api/shipping/estimate
 * Body: { destLat, destLng, destAddress }
 */
const estimateFee = async (req, res, next) => {
  try {
    const { destLat, destLng, destAddress = '' } = req.body;

    if (destLat == null || destLng == null) {
      return res.status(400).json({ success: false, message: 'Thiếu toạ độ điểm đến (destLat, destLng)' });
    }

    const token = await getAhamoveToken();

    const path     = JSON.stringify([
      { lat: STORE_LAT, lng: STORE_LNG, name: 'Coffea',     address: STORE_ADDRESS, mobile: STORE_PHONE },
      { lat: destLat,   lng: destLng,   name: 'Khách hàng', address: destAddress,   mobile: STORE_PHONE },
    ]);
    const services = JSON.stringify([{ _id: 'SGN-BIKE', requests: [] }]);

    const { data } = await axios.get(`${AHAMOVE_API}/v1/order/estimated_fee`, {
      params: { token, order_time: 0, path, services },
    });

    return res.json({
      success: true,
      data: {
        totalPrice: data.total_price ?? 0,
        distance:   data.distance   ?? 0,
        duration:   data.duration   ?? 0,
      },
    });
  } catch (error) {
    if (error.response) {
      const msg = error.response.data?.description || `Ahamove lỗi ${error.response.status}`;
      return res.status(502).json({ success: false, message: msg });
    }
    next(error);
  }
};

module.exports = { estimateFee };
