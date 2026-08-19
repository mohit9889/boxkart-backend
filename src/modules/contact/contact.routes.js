const express = require('express');
const router = express.Router();
const contactController = require('./contact.controller');

/**
 * POST /api/v1/contact
 * Public endpoint to submit a generic contact form.
 */
router.post('/', contactController.submitContactForm);

module.exports = router;
