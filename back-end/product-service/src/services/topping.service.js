const toppingRepo = require('../repositories/topping.repo');
const { AppError } = require('../../../shared');

const getAllToppings = async (onlyAvailable = false) => {
  const filter = onlyAvailable ? { status: 'ACTIVE', isAvailable: true } : {};
  return await toppingRepo.findAll(filter);
};

const getToppingById = async (toppingId) => {
  const topping = await toppingRepo.findById(toppingId);
  if (!topping) throw new AppError(`Topping "${toppingId}" không tồn tại`, 404);
  return topping;
};

const createTopping = async (data, createdBy) => {
  if (!data.toppingName) throw new AppError('toppingName là bắt buộc', 400);
  if (data.price === undefined || data.price < 0) throw new AppError('price phải >= 0', 400);

  return await toppingRepo.create({ ...data, createdBy });
};

const updateTopping = async (toppingId, data) => {
  const topping = await toppingRepo.findById(toppingId);
  if (!topping) throw new AppError(`Topping "${toppingId}" không tồn tại`, 404);

  if (data.price !== undefined && data.price < 0) throw new AppError('price phải >= 0', 400);

  return await toppingRepo.updateById(toppingId, data);
};

const deleteTopping = async (toppingId) => {
  const topping = await toppingRepo.findById(toppingId);
  if (!topping) throw new AppError(`Topping "${toppingId}" không tồn tại`, 404);

  await toppingRepo.deleteById(toppingId);
};

module.exports = { getAllToppings, getToppingById, createTopping, updateTopping, deleteTopping };