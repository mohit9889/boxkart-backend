const rfqService = require('./rfq.service');
const { rfqSchema, rfqItemSchema, quoteSchema } = require('./rfq.validation');
const AppError = require('../../utils/AppError');

const createRfq = async (req, res) => {
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
    const rfqs = await rfqService.getUserRfqs(req.user.id);
    res.status(200).json({ success: true, data: rfqs });
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
    const order = await rfqService.acceptQuote(
      req.user.id,
      req.params.id,
      req.params.quoteId,
      req.user.role
    );
    res.status(200).json({ success: true, data: order });
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
