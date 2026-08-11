const rfqService = require('./rfq.service');
const { rfqSchema, rfqItemSchema, quoteSchema, acceptQuoteSchema } = require('./rfq.validation');
const AppError = require('../../utils/AppError');

const createRfq = async (req, res, next) => {
  try {
    const validatedData = rfqSchema.parse(req.body);
    const rfq = await rfqService.createRfq(req.user.id, validatedData);
    res.status(201).json({ success: true, data: rfq });
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

const getRfq = async (req, res, next) => {
  try {
    const rfq = await rfqService.getRfqById(req.user.id, req.params.id, req.user.role);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    next(error);
  }
};

const getUserRfqs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const rfqs = await rfqService.getUserRfqs(req.user.id, page, limit);
    res.json({
      success: true,
      ...rfqs
    });
  } catch (error) {
    next(error);
  }
};

const addRfqItem = async (req, res, next) => {
  try {
    const validatedData = rfqItemSchema.parse(req.body);
    const item = await rfqService.addRfqItem(
      req.user.id,
      req.params.id,
      validatedData
    );
    res.status(201).json({ success: true, data: item });
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

const submitRfq = async (req, res, next) => {
  try {
    const rfq = await rfqService.submitRfq(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    next(error);
  }
};

const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No file uploaded', { code: 'VALIDATION_ERROR', statusCode: 400 }));
    }
    const attachment = await rfqService.uploadAttachment(
      req.user.id,
      req.params.id,
      req.file
    );
    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    next(error);
  }
};

const createQuote = async (req, res, next) => {
  try {
    const validatedData = quoteSchema.parse(req.body);
    
    if (req.user.role !== 'ADMIN') {
      return next(new AppError('Only admins can create quotes', { code: 'FORBIDDEN', statusCode: 403 }));
    }

    const quote = await rfqService.createQuote(
      req.user.id,
      req.params.id,
      validatedData
    );
    res.status(201).json({ success: true, data: quote });
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

const acceptQuote = async (req, res, next) => {
  try {
    const { shippingAddressId, billingAddressId } = acceptQuoteSchema.parse(req.body);
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return next(new AppError('Idempotency-Key header is required and must be between 16 and 128 characters', {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        statusCode: 400
      }));
    }

    const order = await rfqService.acceptQuote(
      req.user.id,
      req.params.id,
      req.params.quoteId,
      shippingAddressId,
      billingAddressId,
      idempotencyKey,
      req.user.role
    );
    res.status(200).json({ success: true, data: order });
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

const cancelRfq = async (req, res, next) => {
  try {
    const rfq = await rfqService.cancelRfq(req.user.id, req.params.id, req.user.role);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRfq,
  getRfq,
  getUserRfqs,
  addRfqItem,
  submitRfq,
  uploadAttachment,
  createQuote,
  acceptQuote,
  cancelRfq,

  getRfqQuotes: async (req, res, next) => {
    try {
      const { id } = req.params;
      const quotes = await rfqService.getRfqQuotes(id, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: quotes });
    } catch (error) {
      next(error);
    }
  },

  getQuote: async (req, res, next) => {
    try {
      const { quoteId } = req.params;
      const quote = await rfqService.getQuote(quoteId, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  },

  rejectQuote: async (req, res, next) => {
    try {
      const { quoteId } = req.params;
      const quote = await rfqService.rejectQuote(quoteId, req.user.id, req.user.role);
      res.status(200).json({ success: true, data: quote });
    } catch (error) {
      next(error);
    }
  }
};
