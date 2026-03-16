const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authMiddleware, authorizeMiddleware } = require('shared');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.use(authMiddleware);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), categoryController.createCategory);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), categoryController.updateCategory);
router.delete('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), categoryController.deleteCategory);

module.exports = router;
