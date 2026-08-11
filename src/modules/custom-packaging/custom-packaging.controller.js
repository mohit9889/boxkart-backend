const rfqService = require('../rfq/rfq.service');
const { rfqItemSchema } = require('../rfq/rfq.validation');

const createCustomPackagingRequest = async (req, res) => {
  try {
    const itemData = rfqItemSchema.parse(req.body);

    // Create a new DRAFT RFQ automatically
    const rfq = await rfqService.createRfq(req.user.id, {
      requiredQuantity: itemData.quantity,
      notes: 'Auto-generated from Custom Packaging Request'
    });

    // Add the custom packaging item to the RFQ
    const item = await rfqService.addRfqItem(req.user.id, rfq.id, itemData);

    res.status(201).json({ success: true, data: { rfq, item } });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('createCustomPackagingRequest error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = {
  createCustomPackagingRequest
};
