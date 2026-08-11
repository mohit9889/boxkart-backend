const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { requireAuth } = require('../../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per `window` for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  skip: () => process.env.NODE_ENV === 'test'
});

router.get('/csrf-token', authController.getCsrfToken);
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
