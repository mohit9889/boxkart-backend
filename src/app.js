const express = require('express');
const morgan = require('morgan');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const logger = require('./infrastructure/logging/logger');
const AppError = require('./utils/AppError');
const routes = require('./routes');
const { env } = require('./config/env');

const app = express();

// Security Headers
app.use(helmet());

// Request ID Middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// CORS Configuration
const allowedOrigins = [
  `http://localhost:${env.PORT}`, // Backend & Swagger UI
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
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    }
  },
  // Skip rate limiting in test environment
  skip: () => process.env.NODE_ENV === 'test'
});

app.use(globalLimiter);

// Structured Logging with Morgan and Winston
app.use(
  morgan(
    (tokens, req, res) => {
      return JSON.stringify({
        requestId: req.id,
        userId: req.user?.id || null,
        method: tokens.method(req, res),
        route: tokens.url(req, res),
        statusCode: tokens.status(req, res),
        durationMs: tokens['response-time'](req, res)
      });
    },
    {
      stream: { write: (message) => logger.info(message.trim()) },
      // Skip normal morgan logging in test to keep console clean, winston handles silent config
      skip: () => process.env.NODE_ENV === 'test'
    }
  )
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', routes);

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'CORS policy violation'
      }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(Object.keys(err.details || {}).length > 0 && { details: err.details })
      }
    });
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

module.exports = app;
