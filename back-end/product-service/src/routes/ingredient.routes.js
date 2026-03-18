const express = require('express');
const router = express.Router();
const ingredientController = require('../controllers/ingredient.controller');
const { authMiddleware, authorizeMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.get('/', ingredientController.getAllIngredients);
router.get('/:id', ingredientController.getIngredientById);
router.post('/', authorizeMiddleware('ADMIN', 'MANAGER'), ingredientController.createIngredient);
router.put('/:id', authorizeMiddleware('ADMIN', 'MANAGER'), ingredientController.updateIngredient);

// Import logs
router.post('/:id/import', authorizeMiddleware('ADMIN', 'MANAGER'), ingredientController.importIngredient);
router.get('/:id/import-logs', ingredientController.getImportLogs);

module.exports = router;
