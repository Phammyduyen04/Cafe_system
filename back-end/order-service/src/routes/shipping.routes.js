const express = require('express');
const router  = express.Router();
const { estimateFee } = require('../controllers/shipping.controller');
const { authMiddleware } = require('../../../shared');

router.use(authMiddleware);

router.post('/estimate', estimateFee);

module.exports = router;
