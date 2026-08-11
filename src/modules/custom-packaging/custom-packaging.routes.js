const express = require('express');
const router = express.Router();
const customPackagingController = require('./custom-packaging.controller');
const { requireAuth } = require('../../middleware/auth');

router.post(
  '/requests',
  requireAuth,
  customPackagingController.createCustomPackagingRequest
);

module.exports = router;
