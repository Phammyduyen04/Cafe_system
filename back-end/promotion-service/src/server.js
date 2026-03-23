require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { errorHandler } = require('../../shared');
const discountRoutes = require('./routes/discount.routes');
const promotionRoutes = require('./routes/promotion.routes');
const Promotion = require('./models/promotion.model');
const Discount = require('./models/discount.model');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB - Promotion DB');

    // Cron job: tự động cập nhật trạng thái mỗi phút
    cron.schedule('* * * * *', async () => {
      const now = new Date();
      try {
        // PLANNED → ACTIVE (startDate đã đến)
        await Promotion.updateMany(
          { status: 'PLANNED', startDate: { $lte: now } },
          { $set: { status: 'ACTIVE' } }
        );
        // ACTIVE → EXPIRED (endDate đã qua, chỉ docs có endDate != null)
        await Promotion.updateMany(
          { status: 'ACTIVE', endDate: { $ne: null, $lt: now } },
          { $set: { status: 'EXPIRED' } }
        );
        // Tương tự cho Discount
        await Discount.updateMany(
          { status: 'PLANNED', startDate: { $lte: now } },
          { $set: { status: 'ACTIVE' } }
        );
        await Discount.updateMany(
          { status: 'ACTIVE', endDate: { $ne: null, $lt: now } },
          { $set: { status: 'EXPIRED' } }
        );
      } catch (err) {
        console.error('[Cron] Status update error:', err.message);
      }
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Promotion Service is running', timestamp: new Date().toISOString() });
});

app.use('/api/discounts', discountRoutes);
app.use('/api/promotions', promotionRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Promotion Service is running on port ${PORT}`);
});
