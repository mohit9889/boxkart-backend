const prisma = require('../../infrastructure/database/prismaClient');
const AppError = require('../../utils/AppError');

/**
 * GET /api/v1/bundles
 * Returns all active bundles ordered by sortOrder.
 */
const listBundles = async (req, res, next) => {
  try {
    const bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, data: bundles });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/bundles/:slug
 * Returns a single bundle by slug.
 */
const getBundleBySlug = async (req, res, next) => {
  try {
    const bundle = await prisma.bundle.findUnique({
      where: { slug: req.params.slug },
    });
    if (!bundle || !bundle.isActive) {
      return next(new AppError('Bundle not found', { code: 'NOT_FOUND', statusCode: 404 }));
    }
    res.json({ success: true, data: bundle });
  } catch (error) {
    next(error);
  }
};

module.exports = { listBundles, getBundleBySlug };
