const express = require('express');
const { calculate } = require('./pricing.controller');

const router = express.Router();

router.post('/calculate', calculate);

module.exports = router;
