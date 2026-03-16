const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authMiddleware, authorizeMiddleware } = require('shared');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.use(authMiddleware);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), productController.createProduct);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), productController.updateProduct);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), productController.deleteProduct);

module.exports = router;
