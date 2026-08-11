const crypto = require('crypto');
const AppError = require('../utils/AppError');

// Generates a random CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Middleware to enforce CSRF validation on mutating requests
const csrfProtection = (req, res, next) => {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for test environment unless explicitly testing CSRF
  if (process.env.NODE_ENV === 'test' && !req.headers['x-csrf-test']) {
    return next();
  }

  const cookieToken = req.cookies['csrf_token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('Invalid or missing CSRF token', {
      code: 'FORBIDDEN',
      statusCode: 403
    }));
  }

  next();
};

module.exports = {
  csrfProtection,
  generateCsrfToken
};
