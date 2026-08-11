const rfqService = require('../rfq/rfq.service');
const { rfqItemSchema } = require('../rfq/rfq.validation');
const AppError = require('../../utils/AppError');

const createCustomPackagingRequest = async (req, res, next) => {
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
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

module.exports = {
  createCustomPackagingRequest
};
