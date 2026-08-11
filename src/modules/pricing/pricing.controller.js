const { calculateSchema } = require('./pricing.validation');
const pricingService = require('./pricing.service');

const calculate = async (req, res) => {
  try {
    const { productId, quantity } = calculateSchema.parse(req.body);
    const pricing = await pricingService.calculatePriceForProduct(
      productId,
      quantity
    );
    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    if (
      error.message.includes('Minimum order quantity') ||
      error.message.includes('Product not found')
    ) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('pricing calculate error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = { calculate };
