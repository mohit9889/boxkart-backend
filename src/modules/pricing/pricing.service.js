const prisma = require('../../infrastructure/database/prismaClient');
const { calculateSubtotal, selectApplicablePriceTier } = require('./pricing.domain');
const AppError = require('../../utils/AppError');

const calculatePriceForProduct = async (productId, quantity) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      priceTiers: true
    }
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new AppError('Product not found or inactive', { code: 'PRODUCT_NOT_FOUND', statusCode: 404 });
  }

  try {
    const matchingTier = selectApplicablePriceTier(quantity, product.priceTiers);
    if (!matchingTier) {
      throw new AppError('INVALID_QUANTITY', { code: 'INVALID_QUANTITY', statusCode: 400 });
    }

    const unitPriceMinor = matchingTier.unitPriceMinor;
    const subtotalMinor = calculateSubtotal(unitPriceMinor, quantity);

    return {
      unitPriceMinor,
      subtotalMinor,
      currency: matchingTier.currency,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      }
    };
  } catch (error) {
    if (error.message === 'INVALID_QUANTITY') {
      const minTier = [...product.priceTiers].sort(
        (a, b) => a.minimumQuantity - b.minimumQuantity
      )[0];
      throw new AppError(
        `Minimum order quantity is ${minTier ? minTier.minimumQuantity : 'unknown'}`,
        { code: 'BELOW_MOQ', statusCode: 400 }
      );
    }
    throw error;
  }
};

module.exports = {
  calculatePriceForProduct
};
