const { verifyToken } = require('../modules/auth/token.service');
const prisma = require('../infrastructure/database/prismaClient');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'User is inactive or deleted' });
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
