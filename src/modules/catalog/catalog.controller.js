const prisma = require('../../infrastructure/database/prismaClient');
const { productQuerySchema } = require('./catalog.validation');
const AppError = require('../../utils/AppError');

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' }
    });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug }
    });

    if (!category || category.status !== 'ACTIVE') {
      return next(new AppError('Category not found', { code: 'CATEGORY_NOT_FOUND', statusCode: 404 }));
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const query = productQuerySchema.parse(req.query);

    const where = { status: 'ACTIVE' };

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.productType) {
      where.productType = query.productType;
    }

    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } }
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (field === 'createdAt' && ['asc', 'desc'].includes(direction)) {
        orderBy = { createdAt: direction };
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1
          },
          priceTiers: {
            orderBy: { minimumQuantity: 'asc' },
            take: 1
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: products,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit)
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        boxSpecification: true,
        images: { orderBy: { sortOrder: 'asc' } },
        priceTiers: { orderBy: { minimumQuantity: 'asc' } },
        inventory: true
      }
    });

    if (!product || product.status !== 'ACTIVE') {
      return next(new AppError('Product not found', { code: 'PRODUCT_NOT_FOUND', statusCode: 404 }));
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug
};
