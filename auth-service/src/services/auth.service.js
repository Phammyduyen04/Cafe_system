const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError } = require('shared');
const accountRepo = require('../repositories/account.repo');
const refreshTokenRepo = require('../repositories/refreshToken.repo');

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
 * Đăng ký tài khoản mới
 */
const register = async (data) => {
  const { username, password, userType, userId } = data;

  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const existingAccount = await accountRepo.findByUsername(username);
  if (existingAccount) {
    throw new AppError('Username already exists', 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const account = await accountRepo.create({
    username,
    password_hash: passwordHash,
    user_type: userType || 'CUSTOMER',
    user_id: userId || null,
  });

  return {
    accountId: account.account_id,
    username: account.username,
    userType: account.user_type,
  };
};

/**
 * Đăng nhập
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Username and password are required', 400);
  }

  const account = await accountRepo.findByUsername(username);
  if (!account) {
    throw new AppError('Invalid credentials', 401);
  }

  if (account.account_status !== 'ACTIVE') {
    throw new AppError('Account is not active', 403);
  }

  const isMatch = await bcrypt.compare(password, account.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
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
    throw new AppError('Refresh token is required', 400);
  }

  const storedToken = await refreshTokenRepo.findByToken(token);
  if (!storedToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  if (storedToken.revoked_at) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  if (new Date() > storedToken.expires_at) {
    throw new AppError('Refresh token has expired', 401);
  }

  const account = await accountRepo.findById(storedToken.account_id);
  if (!account || account.account_status !== 'ACTIVE') {
    throw new AppError('Account not found or inactive', 401);
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
    throw new AppError('Account not found', 404);
  }

  const accountRoles = await accountRepo.getAccountRoles(accountId);

  return {
    accountId: account.account_id,
    username: account.username,
    userType: account.user_type,
    userId: account.user_id,
    status: account.account_status,
    roles: accountRoles.map((r) => r.role.role_name),
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
    throw new AppError('Account not found', 404);
  }

  const isMatch = await bcrypt.compare(oldPassword, account.password_hash);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await accountRepo.updatePassword(accountId, passwordHash);
  // Revoke all refresh tokens
  await refreshTokenRepo.revokeAllByAccountId(accountId);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getAccountById,
  changePassword,
};
