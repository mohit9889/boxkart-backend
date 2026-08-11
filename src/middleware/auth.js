const AppError = require('../utils/AppError');
const prisma = require('../infrastructure/database/prismaClient');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next(new AppError('Authentication required', { code: 'UNAUTHORIZED', statusCode: 401 }));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return next(new AppError('Invalid or expired token', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return next(new AppError('User is inactive or deleted', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', { code: 'UNAUTHORIZED', statusCode: 401 }));
    }
    next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  requireAuth(req, res, async (err) => {
    if (err) return next(err);
    try {
      if (req.user.role !== 'ADMIN') {
        return next(new AppError('Forbidden: Admin access required', { code: 'FORBIDDEN', statusCode: 403 }));
      }
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { requireAuth, requireAdmin };
