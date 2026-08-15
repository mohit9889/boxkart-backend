const express = require('express');
const router = express.Router();
const customPackagingController = require('./custom-packaging.controller');
const { requireAuth } = require('../../middleware/auth');

/**
 * PUBLIC — no auth required.
 * Accepts guest inquiries from the "Need packaging made for your brand?" form.
 */
router.post('/inquiries', customPackagingController.createGuestInquiry);

/**
 * AUTHENTICATED — requires a logged-in user.
 * Creates a full RFQ-backed custom packaging request.
 */
router.post(
  '/requests',
  requireAuth,
  customPackagingController.createCustomPackagingRequest
);

module.exports = router;
