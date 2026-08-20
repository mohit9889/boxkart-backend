const express = require('express');
const router = express.Router();
const rfqController = require('../rfq/rfq.controller');
const { requireAuth } = require('../../middleware/auth');

router.get('/', requireAuth, rfqController.getUserQuotes);
router.get('/:quoteId', requireAuth, rfqController.getQuote);
router.post('/:quoteId/accept', requireAuth, rfqController.acceptQuote);
router.post('/:quoteId/reject', requireAuth, rfqController.rejectQuote);

module.exports = router;
