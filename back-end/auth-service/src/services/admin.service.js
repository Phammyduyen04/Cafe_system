const bcrypt = require('bcryptjs');
const accountRepo = require('../repositories/account.repo');
const roleRepo = require('../repositories/role.repo');
const accountRoleRepo = require('../repositories/accountRole.repo');
const { AppError } = require('../../../shared');

/* ── Helpers ─────────────────────────────────────────────── */

const VALID_POSITIONS = ['STAFF', 'CASHIER', 'BARISTA', 'KITCHEN', 'CLEANER', 'MANAGER', 'SUPERVISOR'];

const generatePassword = () => {
  const digits = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const suffix = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `Coffea@${digits}${suffix}`;
};

const userTypeFromPosition = (position) => {
  const upper = position.toUpperCase();
  return ['MANAGER', 'SUPERVISOR'].includes(upper) ? 'MANAGER' : 'STAFF';
};

const roleNameFromPosition = (position) => {
  return userTypeFromPosition(position) === 'MANAGER' ? 'MANAGER' : 'STAFF';
};

/* ── Create staff account (auto-generate credentials) ─────── */

const createStaffAccount = async (adminUsername, data) => {
  const { fullName, phoneNumber, email, position, branch, startDate } = data;

  if (!fullName || !fullName.trim()) throw new AppError('Họ tên là bắt buộc', 400);
  if (!position) throw new AppError('Chức vụ là bắt buộc', 400);

  const positionUpper = position.toUpperCase();
  if (!VALID_POSITIONS.includes(positionUpper)) {
    throw new AppError(`Chức vụ không hợp lệ. Hợp lệ: ${VALID_POSITIONS.join(', ')}`, 400);
  }

  // Check duplicate email
  if (email && email.trim()) {
    const existing = await accountRepo.findByEmail(email.trim());
    if (existing) throw new AppError('Email này đã được sử dụng bởi tài khoản khác', 409);
  }

  // Check duplicate phone (search in existing accounts)
  // (phone is not stored in account table directly, but we can note it)

  // Generate username
  let baseUsername;
  if (email && email.includes('@')) {
    baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  } else if (phoneNumber) {
    const digits = phoneNumber.replace(/\D/g, '');
    baseUsername = 'nv' + digits.slice(-8);
  } else {
    baseUsername = 'nv' + Date.now().toString().slice(-6);
  }
  if (!baseUsername || baseUsername.length < 3) baseUsername = 'nv' + Date.now().toString().slice(-6);

  let username = baseUsername;
  let counter = 1;
  while (await accountRepo.findByUsername(username)) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  // Generate password
  const plainPassword = generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const userType = userTypeFromPosition(position);

  // Create account
  const account = await accountRepo.create({
    username,
    password_hash: passwordHash,
    full_name: fullName.trim(),
    email: email ? email.trim() : null,
    user_type: userType,
  });

  // Assign role
  const roleName = roleNameFromPosition(position);
  try {
    const role = await roleRepo.findByName(roleName);
    if (role) {
      await accountRoleRepo.assign(account.account_id, role.role_id, adminUsername);
    }
  } catch (err) {
    console.warn('Could not assign role:', err.message);
  }

  return {
    accountId: account.account_id,
    username: account.username,
    password: plainPassword,
    fullName: account.full_name,
    email: account.email,
    userType: account.user_type,
    role: roleName,
    position: positionUpper,
    branch: branch || null,
    startDate: startDate || null,
    createdAt: account.created_at,
  };
};

/* ── List accounts ────────────────────────────────────────── */

const listAccounts = async (params) => {
  const { page = 1, limit = 20, search, userType, status } = params;
  const result = await accountRepo.findAll({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    userType,
    status,
  });

  const items = result.items.map((acc) => ({
    accountId: acc.account_id,
    username: acc.username,
    fullName: acc.full_name,
    email: acc.email,
    userType: acc.user_type,
    status: acc.account_status,
    roles: (acc.account_roles || []).map((ar) => ar.role.role_name),
    hasPassword: !!acc.password_hash,
    isGoogleAccount: !!acc.google_id,
    lastLoginAt: acc.last_login_at,
    createdAt: acc.created_at,
  }));

  return {
    data: items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
};

/* ── Get single account ───────────────────────────────────── */

const getAccount = async (accountId) => {
  const acc = await accountRepo.findById(accountId);
  if (!acc) throw new AppError('Không tìm thấy tài khoản', 404);
  const roles = await accountRepo.getAccountRoles(accountId);
  return {
    accountId: acc.account_id,
    username: acc.username,
    fullName: acc.full_name,
    email: acc.email,
    userType: acc.user_type,
    status: acc.account_status,
    roles: roles.map((r) => r.role.role_name),
    hasPassword: !!acc.password_hash,
    isGoogleAccount: !!acc.google_id,
    lastLoginAt: acc.last_login_at,
    createdAt: acc.created_at,
  };
};

/* ── Update account info ──────────────────────────────────── */

const updateAccount = async (accountId, data) => {
  const { fullName, email, userType } = data;
  const acc = await accountRepo.findById(accountId);
  if (!acc) throw new AppError('Không tìm thấy tài khoản', 404);

  // Check email uniqueness if changed
  if (email && email !== acc.email) {
    const existing = await accountRepo.findByEmail(email);
    if (existing && existing.account_id !== accountId) {
      throw new AppError('Email này đã được sử dụng bởi tài khoản khác', 409);
    }
  }

  const updated = await accountRepo.update(accountId, {
    ...(fullName !== undefined && { full_name: fullName }),
    ...(email !== undefined && { email: email || null }),
    ...(userType !== undefined && { user_type: userType }),
  });

  return {
    accountId: updated.account_id,
    username: updated.username,
    fullName: updated.full_name,
    email: updated.email,
    userType: updated.user_type,
    status: updated.account_status,
  };
};

/* ── Toggle account status (ACTIVE ↔ INACTIVE) ────────────── */

const toggleAccountStatus = async (accountId) => {
  const acc = await accountRepo.findById(accountId);
  if (!acc) throw new AppError('Không tìm thấy tài khoản', 404);

  const newStatus = acc.account_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const updated = await accountRepo.updateStatus(accountId, newStatus);

  return {
    accountId: updated.account_id,
    username: updated.username,
    status: updated.account_status,
  };
};

/* ── Reset password (admin resets for a user) ─────────────── */

const resetAccountPassword = async (accountId, newPassword) => {
  const acc = await accountRepo.findById(accountId);
  if (!acc) throw new AppError('Không tìm thấy tài khoản', 404);

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await accountRepo.updatePassword(accountId, passwordHash);

  return { accountId, username: acc.username };
};

module.exports = {
  createStaffAccount,
  listAccounts,
  getAccount,
  updateAccount,
  toggleAccountStatus,
  resetAccountPassword,
};
