require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('../../shared');
const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/role.routes');
const adminRoutes = require('./routes/admin.routes');

const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve avatar images
const avatarDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
app.use('/uploads/avatars', express.static(avatarDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Auth Service is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/roles', roleRoutes);
app.use('/api/auth/admin', adminRoutes);

// Internal API (không cần auth, chỉ dùng giữa các service)
const accountRepo = require('./repositories/account.repo');
app.put('/internal/deactivate-account/:accountId', async (req, res) => {
  try {
    const prisma = require('./models/prisma');
    await prisma.account.update({
      where: { account_id: req.params.accountId },
      data: { account_status: 'INACTIVE' },
    });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    console.error('Internal deactivate-account error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
