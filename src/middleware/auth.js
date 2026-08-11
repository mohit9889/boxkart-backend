const { verifyToken } = require('../modules/auth/token.service');
const prisma = require('../infrastructure/database/prismaClient');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is inactive or deleted'
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res
      .status(500)
      .json({ error: 'Internal server error during authentication' });
  }
};

const requireAdmin = async (req, res, next) => {
  // First ensure user is authenticated
  requireAuth(req, res, async () => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res
          .status(403)
          .json({
            success: false,
            error: { message: 'Forbidden: Admin access required' }
          });
      }
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res
        .status(500)
        .json({ success: false, error: { message: 'Internal server error' } });
    }
  });
};

module.exports = { requireAuth, requireAdmin };
