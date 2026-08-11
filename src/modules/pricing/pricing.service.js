const prisma = require('../../infrastructure/database/prismaClient');
const { calculateUnitPrice, calculateSubtotal } = require('./pricing.domain');

const calculatePriceForProduct = async (productId, quantity) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      priceTiers: true
    }
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product not found or inactive');
  }

  try {
    const unitPriceMinor = calculateUnitPrice(quantity, product.priceTiers);
    const subtotalMinor = calculateSubtotal(unitPriceMinor, quantity);

    return {
      unitPriceMinor,
      subtotalMinor,
      currency: 'USD',
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
      throw new Error(
        `Minimum order quantity is ${minTier ? minTier.minimumQuantity : 'unknown'}`
      );
    }
    throw error;
  }
};

module.exports = {
  calculatePriceForProduct
};
