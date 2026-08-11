const express = require('express');
const { recommend } = require('./box-engine.controller');

const router = express.Router();

router.post('/recommend', recommend);

module.exports = router;
