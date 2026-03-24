const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { AppError, publisher } = require('../../../shared');

/**
 * Gửi HTTP request nội bộ giữa các service (không dùng fetch để tương thích mọi Node version)
 */
const internalPost = (url, body) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => { buf += chunk; });
        res.on('end', () => resolve({ ok: res.statusCode < 300, statusCode: res.statusCode, body: buf }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};
const accountRepo = require('../repositories/account.repo');
const refreshTokenRepo = require('../repositories/refreshToken.repo');
const roleRepo = require('../repositories/role.repo');
const accountRoleRepo = require('../repositories/accountRole.repo');

const JWT_SECRET = process.env.JWT_SECRET || 'coffee_shop_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Tạo access token
 */
const generateAccessToken = (account, roles) => {
  return jwt.sign(
    {
      accountId: account.account_id,
      username: account.username,
      userType: account.user_type,
      userId: account.user_id,
      roles: roles.map((r) => r.role.role_name),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Tạo refresh token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Tính thời gian hết hạn của refresh token
 */
const getRefreshTokenExpiry = () => {
  const match = JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + value * (multipliers[unit] || 86400000));
};

/**
 * Đăng ký tài khoản CUSTOMER (chỉ CUSTOMER tự đăng ký)
 */
const register = async (data) => {
  const { username, password, userId, phoneNumber, email, fullName } = data;

  if (!username) throw new AppError('Tên đăng nhập là bắt buộc', 400);
  if (!password) throw new AppError('Mật khẩu là bắt buộc', 400);

  const existingAccount = await accountRepo.findByUsername(username);
  if (existingAccount) {
    throw new AppError('Tên đăng nhập đã tồn tại', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const account = await accountRepo.create({
    username,
    password_hash: passwordHash,
    full_name: fullName || null,
    email: email || null,
    user_type: 'CUSTOMER',
    user_id: userId || null,
  });

  // Tự động gán role CUSTOMER
  try {
    const role = await roleRepo.findByName('CUSTOMER');
    if (role) {
      await accountRoleRepo.assign(account.account_id, role.role_id, 'system');
    }
  } catch (err) {
    console.warn('Could not auto-assign CUSTOMER role:', err.message);
  }

  // Tạo customer profile trong customer-service
  const customerServiceUrl = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002';
  try {
    const result = await internalPost(`${customerServiceUrl}/internal/create-from-account`, {
      accountId: account.account_id,
      username: account.username,
      phoneNumber: phoneNumber || null,
      email: email || null,
      fullName: fullName || username,
    });
    if (!result.ok) {
      console.warn('Customer profile creation failed:', result.body);
    }
  } catch (err) {
    console.warn('Could not create customer profile:', err.message);
  }

  return {
    accountId: account.account_id,
    username: account.username,
    fullName: account.full_name,
    email: account.email,
    userType: account.user_type,
  };
};

/**
 * Đăng nhập
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Vui lòng nhập tên đăng nhập và mật khẩu', 400);
  }

  // Hỗ trợ đăng nhập bằng username hoặc email
  let account = await accountRepo.findByUsername(username);
  if (!account && username.includes('@')) {
    account = await accountRepo.findByEmail(username);
  }
  if (!account) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng', 401);
  }

  if (account.account_status !== 'ACTIVE') {
    throw new AppError('Tài khoản đã bị vô hiệu hoá', 403);
  }

  const isMatch = await bcrypt.compare(password, account.password_hash);
  if (!isMatch) {
    throw new AppError('Tên đăng nhập hoặc mật khẩu không đúng', 401);
  }

  // Get roles
  const accountRoles = await accountRepo.getAccountRoles(account.account_id);

  // Generate tokens
  const accessToken = generateAccessToken(account, accountRoles);
  const refreshToken = generateRefreshToken();

  // Save refresh token
  await refreshTokenRepo.create({
    account_id: account.account_id,
    token: refreshToken,
    expires_at: getRefreshTokenExpiry(),
  });

  // Update last login
  await accountRepo.updateLastLogin(account.account_id);

  return {
    accessToken,
    refreshToken,
    account: {
      accountId: account.account_id,
      username: account.username,
      fullName: account.full_name,
      email: account.email,
      userType: account.user_type,
      userId: account.user_id,
      roles: accountRoles.map((r) => r.role.role_name),
    },
  };
};

/**
 * Refresh access token
 */
const refreshToken = async (token) => {
  if (!token) {
    throw new AppError('Refresh token là bắt buộc', 400);
  }

  const storedToken = await refreshTokenRepo.findByToken(token);
  if (!storedToken) {
    throw new AppError('Refresh token không hợp lệ', 401);
  }

  if (storedToken.revoked_at) {
    throw new AppError('Refresh token đã bị thu hồi', 401);
  }

  if (new Date() > storedToken.expires_at) {
    throw new AppError('Refresh token đã hết hạn', 401);
  }

  const account = await accountRepo.findById(storedToken.account_id);
  if (!account || account.account_status !== 'ACTIVE') {
    throw new AppError('Tài khoản không tồn tại hoặc đã bị vô hiệu hoá', 401);
  }

  const accountRoles = await accountRepo.getAccountRoles(account.account_id);
  const accessToken = generateAccessToken(account, accountRoles);

  // Rotate refresh token
  await refreshTokenRepo.revoke(storedToken.refresh_token_id);
  const newRefreshToken = generateRefreshToken();
  await refreshTokenRepo.create({
    account_id: account.account_id,
    token: newRefreshToken,
    expires_at: getRefreshTokenExpiry(),
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Đăng xuất - revoke refresh token
 */
const logout = async (accountId, token) => {
  if (token) {
    await refreshTokenRepo.revokeByToken(token);
  } else {
    await refreshTokenRepo.revokeAllByAccountId(accountId);
  }
};

/**
 * Lấy thông tin account
 */
const getAccountById = async (accountId) => {
  const account = await accountRepo.findById(accountId);
  if (!account) {
    throw new AppError('Không tìm thấy tài khoản', 404);
  }

  const accountRoles = await accountRepo.getAccountRoles(accountId);

  return {
    accountId: account.account_id,
    username: account.username,
    fullName: account.full_name,
    email: account.email,
    userType: account.user_type,
    userId: account.user_id,
    status: account.account_status,
    roles: accountRoles.map((r) => r.role.role_name),
    hasPassword: !!account.password_hash,
    isGoogleAccount: !!account.google_id,
    lastLoginAt: account.last_login_at,
    createdAt: account.created_at,
  };
};

/**
 * Đổi mật khẩu
 */
const changePassword = async (accountId, oldPassword, newPassword) => {
  const account = await accountRepo.findById(accountId);
  if (!account) {
    throw new AppError('Không tìm thấy tài khoản', 404);
  }

  const isMatch = await bcrypt.compare(oldPassword, account.password_hash);
  if (!isMatch) {
    throw new AppError('Mật khẩu hiện tại không đúng', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await accountRepo.updatePassword(accountId, passwordHash);
  // Revoke all refresh tokens
  await refreshTokenRepo.revokeAllByAccountId(accountId);
};

/**
 * Đăng nhập / đăng ký bằng Google
 * Frontend gửi idToken lấy từ Google Sign-In, backend verify rồi tạo hoặc đăng nhập account
 */
const googleLogin = async (idToken) => {
  if (!idToken) throw new AppError('Google ID token là bắt buộc', 400);

  const { OAuth2Client } = require('google-auth-library');
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) throw new AppError('Google Client ID chưa được cấu hình', 500);

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new AppError('Token Google không hợp lệ', 401);
  }

  const { sub: googleId, email, name, picture } = payload;

  // 1. Tìm account theo google_id
  let account = await accountRepo.findByGoogleId(googleId);

  if (!account) {
    // 2. Tìm account theo email (user đã đăng ký bằng username/password trước đó)
    if (email) {
      account = await accountRepo.findByEmail(email);
    }

    if (account) {
      // Liên kết google_id vào account đã tồn tại
      const prisma = require('../models/prisma');
      account = await prisma.account.update({
        where: { account_id: account.account_id },
        data: { google_id: googleId },
      });
    } else {
      // 3. Tạo account mới
      const username = email ? email.split('@')[0] : `google_${googleId.substring(0, 8)}`;

      // Đảm bảo username unique
      let finalUsername = username;
      let counter = 1;
      while (await accountRepo.findByUsername(finalUsername)) {
        finalUsername = `${username}${counter}`;
        counter++;
      }

      account = await accountRepo.create({
        username: finalUsername,
        password_hash: null,
        full_name: name || null,
        email: email || null,
        google_id: googleId,
        user_type: 'CUSTOMER',
      });

      // Gán role CUSTOMER
      try {
        const role = await roleRepo.findByName('CUSTOMER');
        if (role) {
          await accountRoleRepo.assign(account.account_id, role.role_id, 'system');
        }
      } catch (err) {
        console.warn('Could not auto-assign CUSTOMER role:', err.message);
      }

      // Tạo customer profile trong customer-service
      const customerServiceUrl = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3002';
      try {
        await internalPost(`${customerServiceUrl}/internal/create-from-account`, {
          accountId: account.account_id,
          username: account.username,
          email: email || null,
          fullName: name || account.username,
        });
      } catch (err) {
        console.warn('Could not create customer profile:', err.message);
      }
    }
  }

  if (account.account_status !== 'ACTIVE') {
    throw new AppError('Tài khoản đã bị vô hiệu hoá', 403);
  }

  // Generate tokens
  const accountRoles = await accountRepo.getAccountRoles(account.account_id);
  const accessToken = generateAccessToken(account, accountRoles);
  const newRefreshToken = generateRefreshToken();

  await refreshTokenRepo.create({
    account_id: account.account_id,
    token: newRefreshToken,
    expires_at: getRefreshTokenExpiry(),
  });

  await accountRepo.updateLastLogin(account.account_id);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    account: {
      accountId: account.account_id,
      username: account.username,
      fullName: account.full_name,
      email: account.email,
      userType: account.user_type,
      userId: account.user_id,
      roles: accountRoles.map((r) => r.role.role_name),
    },
  };
};

const forgotPassword = async (email) => {
  if (!email) throw new AppError('Email là bắt buộc', 400);

  const accounts = await accountRepo.findAllByEmail(email);

  // Luôn trả success để tránh lộ email có tồn tại hay không
  if (!accounts || accounts.length === 0) {
    return { message: 'Nếu email tồn tại, mã xác nhận đã được gửi' };
  }

  const passwordResetTokenRepo = require('../repositories/passwordResetToken.repo');
  const { sendResetCode } = require('../utils/mailer');

  // Tạo mã 6 chữ số (dùng chung cho tất cả accounts cùng email)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenHash = await bcrypt.hash(code, 10);

  // Tạo token cho mỗi account có cùng email
  for (const account of accounts) {
    await passwordResetTokenRepo.deleteAllByAccountId(account.account_id);
    await passwordResetTokenRepo.create({
      account_id: account.account_id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
    });
  }

  // Gửi email
  await sendResetCode(email, code);

  return { message: 'Nếu email tồn tại, mã xác nhận đã được gửi' };
};

const resetPassword = async (email, code, newPassword) => {
  if (!email || !code || !newPassword) {
    throw new AppError('Vui lòng nhập đầy đủ email, mã xác nhận và mật khẩu mới', 400);
  }

  const passwordResetTokenRepo = require('../repositories/passwordResetToken.repo');

  // Tìm tất cả accounts có cùng email
  const accounts = await accountRepo.findAllByEmail(email);
  if (!accounts || accounts.length === 0) {
    throw new AppError('Yêu cầu không hợp lệ', 400);
  }

  // Xác minh mã OTP — chỉ cần 1 token hợp lệ (vì tất cả dùng chung mã)
  let validToken = null;
  for (const account of accounts) {
    const token = await passwordResetTokenRepo.findLatestByAccountId(account.account_id);
    if (token) {
      const isValid = await bcrypt.compare(code, token.token_hash);
      if (isValid) {
        validToken = token;
        break;
      }
    }
  }

  if (!validToken) throw new AppError('Mã xác nhận không hợp lệ hoặc đã hết hạn', 400);

  // Đổi mật khẩu cho TẤT CẢ accounts cùng email
  const passwordHash = await bcrypt.hash(newPassword, 10);
  for (const account of accounts) {
    await accountRepo.updatePassword(account.account_id, passwordHash);
    await refreshTokenRepo.revokeAllByAccountId(account.account_id);

    // Đánh dấu token đã sử dụng
    const token = await passwordResetTokenRepo.findLatestByAccountId(account.account_id);
    if (token) await passwordResetTokenRepo.markUsed(token.reset_token_id);
  }

  return { message: 'Đặt lại mật khẩu thành công' };
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getAccountById,
  changePassword,
  forgotPassword,
  resetPassword,
};
