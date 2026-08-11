const { previewSchema } = require('./checkout.validation');
const { calculatePriceForProduct } = require('../pricing/pricing.service');

const preview = async (req, res) => {
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
          currency: 'USD'
        }
      }
    });
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
    console.error('checkout preview error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = { preview };
