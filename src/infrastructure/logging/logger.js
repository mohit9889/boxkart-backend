const winston = require('winston');

const redactSensitive = winston.format((info) => {
  const sensitiveKeys = [
    'password',
    'token',
    'creditCard',
    'authorization',
    'cookie'
  ];

  const redact = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;
    for (const key of Object.keys(obj)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        redact(obj[key]);
      }
    }
  };

  redact(info);
  return info;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactSensitive(),
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
