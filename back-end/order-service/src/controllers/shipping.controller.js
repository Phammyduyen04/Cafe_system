const axios = require('axios');

const AHAMOVE_API   = process.env.AHAMOVE_API_URL  || 'https://partner-apistg.ahamove.com/v3';
const STORE_LAT     = parseFloat(process.env.STORE_LAT     || '10.8414');
const STORE_LNG     = parseFloat(process.env.STORE_LNG     || '106.8098');
const STORE_ADDRESS = process.env.STORE_ADDRESS || 'Coffea Cafe, TP. Hồ Chí Minh';
const STORE_PHONE   = (process.env.STORE_PHONE || '+84901234567').replace(/^\+/, '');

let _cachedToken    = null;
let _tokenFetchedAt = 0;
const TOKEN_TTL_MS  = 22 * 60 * 60 * 1000;

// ── Haversine distance (km) ────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Tiered fee (VND) based on km ─────────────────────────────────────────
function feeByDistance(km) {
  if (km <= 2)  return 15000;
  if (km <= 5)  return 22000;
  if (km <= 10) return 30000;
  if (km <= 20) return 45000;
  return 60000;
}

async function getAhamoveToken() {
  const directToken = process.env.AHAMOVE_TOKEN;
  if (directToken) return directToken;

  const apiKey = process.env.AHAMOVE_API_KEY;
  if (!apiKey) throw new Error('AHAMOVE_API_KEY not configured');

  if (_cachedToken && Date.now() - _tokenFetchedAt < TOKEN_TTL_MS) return _cachedToken;

  const { data } = await axios.post(`${AHAMOVE_API}/account/token`, {
    api_key: apiKey,
    mobile:  STORE_PHONE,
    name:    'Coffea',
  }, { timeout: 8000 });

  _cachedToken    = data.token;
  _tokenFetchedAt = Date.now();
  return _cachedToken;
}

/**
 * POST /api/shipping/estimate
 * Body: { destLat, destLng, destAddress }
 *
 * Tries Ahamove API first; falls back to Haversine-based fee if unavailable.
 */
const estimateFee = async (req, res) => {
  const { destLat, destLng, destAddress = '' } = req.body;

  if (destLat == null || destLng == null) {
    return res.status(400).json({ success: false, message: 'Thiếu toạ độ điểm đến (destLat, destLng)' });
  }

  // ── Try Ahamove ──────────────────────────────────────────────────────────
  try {
    const token = await getAhamoveToken();
    const { data } = await axios.post(`${AHAMOVE_API}/orders/estimates`, {
      order_time: 0,
      path: [
        { lat: STORE_LAT, lng: STORE_LNG, name: 'Coffea',     address: STORE_ADDRESS, mobile: STORE_PHONE },
        { lat: destLat,   lng: destLng,   name: 'Khách hàng', address: destAddress,   mobile: STORE_PHONE },
      ],
      services:       [{ _id: 'SGN-BIKE', requests: [] }],
      requests:       [],
      payment_method: 'CASH',
    }, { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 });

    const result = Array.isArray(data) ? (data[0]?.data ?? data[0]) : data;
    const totalPrice = result.total_price ?? result.totalPrice ?? 0;
    if (totalPrice > 0) {
      return res.json({
        success: true,
        data: { totalPrice, distance: result.distance ?? 0, duration: result.duration ?? 0, source: 'ahamove' },
      });
    }
    // totalPrice = 0 → fall through to Haversine
  } catch (err) {
    console.warn('[Shipping] Ahamove không khả dụng, dùng fallback Haversine:', err.message);
  }

  // ── Haversine fallback ───────────────────────────────────────────────────
  const km         = haversineKm(STORE_LAT, STORE_LNG, destLat, destLng);
  const totalPrice = feeByDistance(km);
  const duration   = Math.round((km / 25) * 3600); // ~25 km/h average

  return res.json({
    success: true,
    data: { totalPrice, distance: Math.round(km * 1000), duration, source: 'estimate' },
  });
};

module.exports = { estimateFee };
