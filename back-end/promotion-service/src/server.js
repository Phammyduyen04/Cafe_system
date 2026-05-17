require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cron = require('node-cron');
const path = require('path');
const { errorHandler } = require('../../shared');
const discountRoutes = require('./routes/discount.routes');
const promotionRoutes = require('./routes/promotion.routes');
const calculateRoutes = require('./routes/calculate.routes');
const uploadRoutes = require('./routes/upload.routes');
const Promotion = require('./models/promotion.model');
const Discount = require('./models/discount.model');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB - Promotion DB');

    // Cron job: tự động cập nhật trạng thái mỗi phút
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      // So sánh theo ngày (UTC) để tránh lệch múi giờ
      // endDate "2026-05-16" lưu là 2026-05-16T00:00:00Z — phải đợi sang ngày 17 mới EXPIRED
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      try {
        await Promotion.updateMany(
          { status: 'PLANNED', startDate: { $lte: startOfToday } },
          { $set: { status: 'ACTIVE' } }
        );
        await Promotion.updateMany(
          { status: 'ACTIVE', endDate: { $ne: null, $lt: startOfToday } },
          { $set: { status: 'EXPIRED' } }
        );
        await Discount.updateMany(
          { status: 'PLANNED', startDate: { $lte: startOfToday } },
          { $set: { status: 'ACTIVE' } }
        );
        await Discount.updateMany(
          { status: 'ACTIVE', endDate: { $ne: null, $lt: startOfToday } },
          { $set: { status: 'EXPIRED' } }
        );
      } catch (err) {
        console.error('[Cron] Status update error:', err.message);
      }
    }, { runOnInit: true });
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Promotion Service is running', timestamp: new Date().toISOString() });
});

// Thứ tự quan trọng: calculate trước discounts trước promotions
app.use('/api/promotions/upload', uploadRoutes);
app.use('/api/promotions', calculateRoutes);
app.use('/api/promotions/discounts', discountRoutes);
app.use('/api/promotions', promotionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Promotion Service is running on port ${PORT}`);
});
