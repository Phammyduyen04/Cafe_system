const express = require('express');
const router  = express.Router();
const { estimateFee } = require('../controllers/shipping.controller');

router.post('/estimate', estimateFee);

module.exports = router;
