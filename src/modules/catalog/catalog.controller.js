const prisma = require('../../infrastructure/database/prismaClient');
const { productQuerySchema } = require('./catalog.validation');
const AppError = require('../../utils/AppError');

/**
 * GET /categories — returns active categories with product count.
 */
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } }
      }
    });

    const data = categories.map((cat) => ({
      ...cat,
      productCount: cat._count.products,
      _count: undefined
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /categories/:slug — returns single category with product count.
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } }
      }
    });

    if (!category || category.status !== 'ACTIVE') {
      return next(
        new AppError('Category not found', {
          code: 'CATEGORY_NOT_FOUND',
          statusCode: 404
        })
      );
    }

    res.status(200).json({
      success: true,
      data: {
        ...category,
        productCount: category._count.products,
        _count: undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /products — paginated product listing with FE-compatible filters and sorts.
 */
const getProducts = async (req, res, next) => {
  try {
    const query = productQuerySchema.parse(req.query);

    const where = { status: 'ACTIVE' };

    // Category filter (by slug)
    if (query.category) {
      where.category = { slug: query.category };
    }

    // ProductType filter
    if (query.productType) {
      where.productType = query.productType;
    }

    // Ply filter (join to BoxSpecification)
    if (query.ply) {
      where.boxSpecification = {
        ...(where.boxSpecification || {}),
        ply: query.ply
      };
    }

    // Search: name, SKU, description, useCases
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { sku: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { useCases: { has: query.q } }
      ];
    }

    // Determine orderBy
    let orderBy = { createdAt: 'desc' };
    switch (query.sort) {
      case 'name':
        orderBy = { name: 'asc' };
        break;
      case 'moq-asc':
        orderBy = { moq: 'asc' };
        break;
      case 'createdAt:asc':
        orderBy = { createdAt: 'asc' };
        break;
      case 'createdAt:desc':
        orderBy = { createdAt: 'desc' };
        break;
      // price-asc, price-desc, best-value, popular — handled post-query
      default:
        break;
    }

    const skip = (query.page - 1) * query.limit;

    // For price-based sorts we need all priceTiers, so always include them
    const includeSpec = {
      category: true,
      supplier: true,
      images: { orderBy: { sortOrder: 'asc' } },
      priceTiers: { orderBy: { minimumQuantity: 'asc' } },
      boxSpecification: true,
      inventory: true
    };

    let [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        include: includeSpec,
        // For post-query sorts, fetch all matching then slice
        ...(needsPostSort(query.sort) ? {} : { skip, take: query.limit })
      })
    ]);

    // Size filter (needs BoxSpecification data)
    if (query.size) {
      products = products.filter((p) => {
        const spec = p.boxSpecification;
        if (!spec) return false;
        const dims = [
          parseFloat(spec.internalLength.toString()),
          parseFloat(spec.internalWidth.toString()),
          parseFloat(spec.internalHeight.toString())
        ];
        const maxDim = Math.max(...dims);
        // Convert to inches for comparison (specs could be MM/CM/INCH)
        const maxInches = toInches(maxDim, spec.dimensionUnit);
        if (query.size === 'small') return maxInches <= 8;
        if (query.size === 'medium') return maxInches > 8 && maxInches <= 12;
        if (query.size === 'large') return maxInches > 12;
        return true;
      });
      total = products.length;
    }

    // Post-query price-based sorts
    if (query.sort === 'price-asc') {
      products.sort((a, b) => getFirstTierPrice(a) - getFirstTierPrice(b));
    } else if (query.sort === 'price-desc') {
      products.sort((a, b) => getFirstTierPrice(b) - getFirstTierPrice(a));
    } else if (query.sort === 'best-value') {
      products.sort((a, b) => getLowestTierPrice(a) - getLowestTierPrice(b));
    }

    // Manual pagination for post-sort results
    if (needsPostSort(query.sort) || query.size) {
      total = products.length;
      products = products.slice(skip, skip + query.limit);
    }

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
      return next(
        new AppError('Validation failed', {
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details: error.errors
        })
      );
    }
    next(error);
  }
};

/**
 * GET /products/:slug — full product detail with all relations.
 */
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        supplier: true,
        boxSpecification: true,
        images: { orderBy: { sortOrder: 'asc' } },
        priceTiers: { orderBy: { minimumQuantity: 'asc' } },
        inventory: true
      }
    });

    if (!product || product.status !== 'ACTIVE') {
      return next(
        new AppError('Product not found', {
          code: 'PRODUCT_NOT_FOUND',
          statusCode: 404
        })
      );
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/* ── Helpers ── */

/** Check if sort requires post-query processing. */
function needsPostSort(sort) {
  return ['price-asc', 'price-desc', 'best-value'].includes(sort);
}

/** Get first-tier price for sorting (lowest minimumQuantity). */
function getFirstTierPrice(product) {
  return product.priceTiers?.[0]?.unitPriceMinor ?? Infinity;
}

/** Get lowest unit price across all tiers. */
function getLowestTierPrice(product) {
  if (!product.priceTiers?.length) return Infinity;
  return Math.min(...product.priceTiers.map((t) => t.unitPriceMinor));
}

/** Convert dimension to inches for size filtering. */
function toInches(value, unit) {
  switch (unit) {
    case 'MM':
      return value / 25.4;
    case 'CM':
      return value / 2.54;
    case 'INCH':
      return value;
    default:
      return value;
  }
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug
};
