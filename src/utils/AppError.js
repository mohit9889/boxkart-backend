class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.code = options.code || 'INTERNAL_SERVER_ERROR';
    this.statusCode = options.statusCode || 500;
    this.details = options.details || {};
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
