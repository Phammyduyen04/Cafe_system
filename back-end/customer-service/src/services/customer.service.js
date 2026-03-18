const { AppError } = require('../../../shared');
const customerRepo = require('../repositories/customer.repo');
const pointLogRepo = require('../repositories/pointLog.repo');

const createCustomer = async (data) => {
  const { fullName, email, phoneNumber, accountId } = data;
  if (!fullName) throw new AppError('Full name is required', 400);

  return await customerRepo.create({
    full_name: fullName,
    email: email || null,
    phone_number: phoneNumber || null,
    account_id: accountId || null,
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

const updateCustomer = async (id, data) => {
  const customer = await customerRepo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);

  return await customerRepo.update(id, {
    full_name: data.fullName || customer.full_name,
    email: data.email !== undefined ? data.email : customer.email,
    phone_number: data.phoneNumber !== undefined ? data.phoneNumber : customer.phone_number,
    customer_status: data.customerStatus || customer.customer_status,
  });
};

const deleteCustomer = async (id) => {
  const customer = await customerRepo.findById(id);
  if (!customer) throw new AppError('Customer not found', 404);
  return await customerRepo.update(id, { customer_status: 'INACTIVE' });
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

  // Update points
  const newPoints = customer.points + points;
  await customerRepo.update(customerId, { points: newPoints });

  // Log point change
  await pointLogRepo.create({
    customer_id: customerId,
    change_type: changeType,
    points_changed: points,
    reason,
    order_id: orderId,
  });

  return { customerId, previousPoints: customer.points, newPoints, changed: points };
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerPoints,
  getCustomerPointLogs,
  addPoints,
};
