const http = require('http');
const https = require('https');
const { AppError } = require('../../../shared');
const customerRepo = require('../repositories/customer.repo');
const pointLogRepo = require('../repositories/pointLog.repo');

const internalPut = (url) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'PUT',
        headers: { 'Content-Length': 0 },
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => { buf += chunk; });
        res.on('end', () => resolve({ ok: res.statusCode < 300, statusCode: res.statusCode, body: buf }));
      }
    );
    req.on('error', reject);
    req.end();
  });
};

const createCustomer = async (data) => {
  const { fullName, email, phoneNumber, accountId, customerType } = data;
  if (!fullName) throw new AppError('Full name is required', 400);

  if (phoneNumber) {
    const existingPhone = await customerRepo.findByPhoneNumber(phoneNumber);
    if (existingPhone) throw new AppError('Phone number already exists', 409);
  }

  const validTypes = ['REGULAR', 'VIP'];
  if (customerType && !validTypes.includes(customerType)) {
    throw new AppError('customerType must be REGULAR or VIP', 400);
  }

  return await customerRepo.create({
    full_name: fullName,
    email: email || null,
    phone_number: phoneNumber || null,
    account_id: accountId || null,
    customer_type: customerType || 'REGULAR',
  });
};

const getAllCustomers = async (page, limit, search) => {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { full_name: { contains: search } },
          { email: { contains: search } },
          { phone_number: { contains: search } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    customerRepo.findMany(where, skip, limit),
    customerRepo.count(where),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getCustomerById = async (id) => {
  const customer = await customerRepo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

const updateOwnProfile = async (accountId, data) => {
  const customer = await customerRepo.findByAccountId(accountId);
  if (!customer) throw new AppError('Customer profile not found', 404);

  const updateData = {};
  if (data.fullName) updateData.full_name = data.fullName;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.phoneNumber !== undefined) {
    if (data.phoneNumber) {
      const existingPhone = await customerRepo.findByPhoneNumber(data.phoneNumber);
      if (existingPhone && existingPhone.customer_id !== customer.customer_id) {
        throw new AppError('Phone number already exists', 409);
      }
    }
    updateData.phone_number = data.phoneNumber || null;
  }

  return await customerRepo.update(customer.customer_id, updateData);
};

const getCustomerPoints = async (id) => {
  const customer = await customerRepo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  return customer.points;
};

const getCustomerPointLogs = async (id) => {
  return await pointLogRepo.findByCustomerId(id);
};

const addPoints = async (customerId, points, changeType, reason, orderId = null) => {
  const customer = await customerRepo.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);

  const newPoints = customer.points + points;
  if (newPoints < 0) throw new AppError('Insufficient points', 400);

  const updateData = { points: newPoints };
  // Tự động nâng cấp lên VIP khi đạt 200 điểm
  if (newPoints >= 200 && customer.customer_type === 'REGULAR') {
    updateData.customer_type = 'VIP';
  }
  // Tự động hạ cấp về REGULAR khi điểm dưới 200
  if (newPoints < 200 && customer.customer_type === 'VIP') {
    updateData.customer_type = 'REGULAR';
  }

  await customerRepo.update(customerId, updateData);

  await pointLogRepo.create({
    customer_id: customerId,
    change_type: changeType,
    points_changed: points,
    reason,
    order_id: orderId,
  });

  return { customerId, previousPoints: customer.points, newPoints, changed: points };
};

const redeemPoints = async (customerId, points, reason) => {
  if (!points || points <= 0) throw new AppError('Points to redeem must be a positive number', 400);
  const customer = await customerRepo.findById(customerId);
  if (!customer) throw new AppError('Customer not found', 404);
  if (customer.points < points) {
    throw new AppError(`Insufficient points. Available: ${customer.points}, requested: ${points}`, 400);
  }
  return await addPoints(customerId, -points, 'REDEEM', reason || 'Points redeemed');
};

const getCustomerByAccountId = async (accountId) => {
  const customer = await customerRepo.findByAccountId(accountId);
  if (!customer) throw new AppError('Customer not found for this account', 404);
  return customer;
};

// Tự động tạo customer profile khi nhận event account.created từ auth-service
const createCustomerFromAccount = async ({ accountId, username, phoneNumber, email, fullName }) => {
  const existing = await customerRepo.findByAccountId(accountId);
  if (existing) return existing;

  // Bỏ qua phone/email nếu đã tồn tại để tránh lỗi unique constraint
  let resolvedPhone = phoneNumber || null;
  if (resolvedPhone) {
    const existingPhone = await customerRepo.findByPhoneNumber(resolvedPhone);
    if (existingPhone) resolvedPhone = null;
  }

  let resolvedEmail = email || null;
  if (resolvedEmail) {
    const existingEmail = await customerRepo.findByEmail(resolvedEmail);
    if (existingEmail) resolvedEmail = null;
  }

  return await customerRepo.create({
    full_name: fullName || username,
    phone_number: resolvedPhone,
    email: resolvedEmail,
    account_id: accountId,
    customer_type: 'REGULAR',
  });
};

// CUSTOMER tự xóa tài khoản của mình (soft delete, yêu cầu confirm)
const deleteOwnAccount = async (accountId, confirm) => {
  if (!confirm) {
    throw new AppError(
      'Xác nhận xóa tài khoản bằng cách gửi { "confirm": true } trong request body. Lưu ý: thao tác này không thể hoàn tác.',
      400
    );
  }
  const customer = await customerRepo.findByAccountId(accountId);
  if (!customer) throw new AppError('Customer profile not found', 404);

  // Vô hiệu hóa customer profile
  await customerRepo.update(customer.customer_id, { customer_status: 'INACTIVE' });

  // Vô hiệu hóa account trong auth-service
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  try {
    const result = await internalPut(`${authServiceUrl}/internal/deactivate-account/${accountId}`);
    if (!result.ok) {
      console.warn('Could not deactivate auth account:', result.body);
    }
  } catch (err) {
    console.warn('Could not deactivate auth account:', err.message);
  }

  return { message: 'Tài khoản đã được vô hiệu hóa thành công' };
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  createCustomerFromAccount,
  updateOwnProfile,
  deleteOwnAccount,
  getCustomerPoints,
  getCustomerPointLogs,
  addPoints,
  redeemPoints,
};
