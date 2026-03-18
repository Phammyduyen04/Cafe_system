const productService = require('../services/product.service');
const { responseHelper } = require('../../../shared');

const createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    return responseHelper.created(res, product, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, categoryId, status } = req.query;
    const result = await productService.getAllProducts(parseInt(page), parseInt(limit), { search, categoryId, status });
    return responseHelper.paginated(res, result.products, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(req.params.id);
    return responseHelper.success(res, product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return responseHelper.success(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return responseHelper.success(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };
