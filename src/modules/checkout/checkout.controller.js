const { previewSchema } = require('./checkout.validation');
const { calculatePriceForProduct } = require('../pricing/pricing.service');
const AppError = require('../../utils/AppError');

const preview = async (req, res, next) => {
  try {
    const { items } = previewSchema.parse(req.body);

    let subtotalMinor = 0;
    const pricedItems = [];

    for (const item of items) {
      const pricing = await calculatePriceForProduct(
        item.productId,
        item.quantity
      );
      subtotalMinor += pricing.subtotalMinor;

      pricedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        pricing: {
          unitPriceMinor: pricing.unitPriceMinor,
          subtotalMinor: pricing.subtotalMinor,
          currency: pricing.currency
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        items: pricedItems,
        summary: {
          subtotalMinor,
          currency: 'INR'
        }
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

module.exports = { preview };
