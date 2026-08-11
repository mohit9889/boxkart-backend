const express = require('express');
const router = express.Router();
const rfqController = require('./rfq.controller');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const multer = require('multer');
const AppError = require('../../utils/AppError');

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and PDF are allowed.', { code: 'UNSUPPORTED_MEDIA_TYPE', statusCode: 415 }), false);
    }
  }
});

router.post('/', requireAuth, rfqController.createRfq);
router.get('/', requireAuth, rfqController.getUserRfqs);
router.get('/:id', requireAuth, rfqController.getRfq);
router.get('/:id/quotes', requireAuth, rfqController.getRfqQuotes);
router.post('/:id/items', requireAuth, rfqController.addRfqItem);
router.post('/:id/submit', requireAuth, rfqController.submitRfq);
router.post('/:id/cancel', requireAuth, rfqController.cancelRfq);
router.post(
  '/:id/attachments',
  requireAuth,
  upload.single('file'),
  rfqController.uploadAttachment
);

// Admin action
router.post('/:id/quote', requireAdmin, rfqController.createQuote);
// Accept Quote action
router.post(
  '/:id/quotes/:quoteId/accept',
  requireAuth,
  rfqController.acceptQuote
);

module.exports = router;
