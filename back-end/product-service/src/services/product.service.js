const { AppError } = require('../../../shared');
const productRepo = require('../repositories/product.repo');

const createProduct = async (data, user) => {
  const { productId, productName, price, description, productCategoryId, image } = data;
  if (!productId || !productName || !price) {
    throw new AppError('Product ID, name, and price are required', 400);
  }

  return await productRepo.create({
    productId,
    productName,
    price,
    description: description || '',
    productCategoryId,
    image: image || '',
    createdBy: user.username,
  });
};

const getAllProducts = async (page, limit, filters) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.search) {
    query.productName = { $regex: filters.search, $options: 'i' };
  }
  if (filters.categoryId) {
    query.productCategoryId = filters.categoryId;
  }
  if (filters.status) {
    query.status = filters.status;
  }

  const [products, total] = await Promise.all([
    productRepo.findMany(query, skip, limit),
    productRepo.count(query),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getProductById = async (id) => {
  const product = await productRepo.findByProductId(id);
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

const updateProduct = async (id, data) => {
  const product = await productRepo.findByProductId(id);
  if (!product) throw new AppError('Product not found', 404);
  return await productRepo.update(id, data);
};

const deleteProduct = async (id) => {
  const product = await productRepo.findByProductId(id);
  if (!product) throw new AppError('Product not found', 404);
  return await productRepo.update(id, { status: 'INACTIVE' });
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
