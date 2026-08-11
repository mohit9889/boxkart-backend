const express = require('express');
const { preview } = require('./checkout.controller');

const router = express.Router();

router.post('/preview', preview);

module.exports = router;
