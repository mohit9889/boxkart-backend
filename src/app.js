const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./infrastructure/logging/logger');
const routes = require('./routes');
const { env } = require('./config/env');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  `http://localhost:${env.PORT}`,
  'http://localhost:3005', // Swagger UI
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.' }
  },
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test'
});

app.use(globalLimiter);

// Structured Logging with Morgan and Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.info(message.trim()) },
    // Skip normal morgan logging in test to keep console clean, winston handles silent config
    skip: () => process.env.NODE_ENV === 'test'
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', routes);

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: { message: 'Not Found' } });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res
      .status(403)
      .json({ success: false, error: { message: 'CORS policy violation' } });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({ success: false, error: { message } });
});

module.exports = app;
