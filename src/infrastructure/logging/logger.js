const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.prettyPrint()
  ),
  defaultMeta: { service: 'box-engine-api' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
    })
  ]
});

// Avoid logging in test environment unless specifically requested
if (process.env.NODE_ENV === 'test' && process.env.LOG_LEVEL !== 'debug') {
  logger.transports.forEach((t) => (t.silent = true));
}

module.exports = logger;
