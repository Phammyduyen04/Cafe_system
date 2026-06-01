const axios = require('axios');

const AHAMOVE_API   = process.env.AHAMOVE_API_URL  || 'https://partner-apistg.ahamove.com/v3';
const STORE_LAT     = parseFloat(process.env.STORE_LAT     || '10.8414');
const STORE_LNG     = parseFloat(process.env.STORE_LNG     || '106.8098');
const STORE_ADDRESS = process.env.STORE_ADDRESS || 'Coffea Cafe, TP. Hồ Chí Minh';
// AhaMove yêu cầu format 84XXXXXXXXX (không có dấu +)
const STORE_PHONE   = (process.env.STORE_PHONE || '+84901234567').replace(/^\+/, '');

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

  const loginUrl = `${AHAMOVE_API}/accounts/token`;
  console.log('[AhaMove] Gọi login:', loginUrl, '| mobile:', STORE_PHONE, '| api_key:', apiKey.slice(0, 8) + '...');
  const { data } = await axios.post(loginUrl, {
    api_key: apiKey,
    mobile:  STORE_PHONE,
  });
  console.log('[AhaMove] Login thành công, token:', data.token?.slice(0, 12) + '...');

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

    const { data } = await axios.post(`${AHAMOVE_API}/orders/estimates`, {
      order_time:     0,
      path: [
        { lat: STORE_LAT, lng: STORE_LNG, name: 'Coffea',     address: STORE_ADDRESS, mobile: STORE_PHONE },
        { lat: destLat,   lng: destLng,   name: 'Khách hàng', address: destAddress,   mobile: STORE_PHONE },
      ],
      services:       [{ _id: 'SGN-BIKE', requests: [] }],
      requests:       [],
      payment_method: 'CASH',
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Response là array: [{ service_id, data: { total_price, distance, duration } }]
    const result = Array.isArray(data) ? (data[0]?.data ?? data[0]) : data;

    return res.json({
      success: true,
      data: {
        totalPrice: result.total_price ?? result.totalPrice ?? 0,
        distance:   result.distance   ?? 0,
        duration:   result.duration   ?? 0,
      },
    });
  } catch (error) {
    if (error.response) {
      console.error('[AhaMove] Lỗi từ API:', error.response.status, JSON.stringify(error.response.data));
      const msg = error.response.data?.description || error.response.data?.message || `Ahamove lỗi ${error.response.status}`;
      return res.status(502).json({ success: false, message: msg });
    }
    console.error('[AhaMove] Lỗi không phải từ API:', error.message);
    next(error);
  }
};

module.exports = { estimateFee };
