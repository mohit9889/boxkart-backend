const { calculateSchema } = require('./pricing.validation');
const pricingService = require('./pricing.service');
const AppError = require('../../utils/AppError');

const calculate = async (req, res, next) => {
  try {
    const { productId, quantity } = calculateSchema.parse(req.body);
    const pricing = await pricingService.calculatePriceForProduct(
      productId,
      quantity
    );
    res.status(200).json({ success: true, data: pricing });
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

module.exports = { calculate };
