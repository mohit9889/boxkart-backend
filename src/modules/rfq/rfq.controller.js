const rfqService = require('./rfq.service');
const { rfqSchema, rfqItemSchema, quoteSchema } = require('./rfq.validation');

const createRfq = async (req, res) => {
  try {
    const validatedData = rfqSchema.parse(req.body);
    const rfq = await rfqService.createRfq(req.user.id, validatedData);
    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('createRfq error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getRfq = async (req, res) => {
  try {
    const rfq = await rfqService.getRfqById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    if (error.message === 'RFQ not found') {
      return res
        .status(404)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('getRfq error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getUserRfqs = async (req, res) => {
  try {
    const rfqs = await rfqService.getUserRfqs(req.user.id);
    res.status(200).json({ success: true, data: rfqs });
  } catch (error) {
    console.error('getUserRfqs error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const addRfqItem = async (req, res) => {
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
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    if (error.message.includes('Cannot add items to non-draft RFQ')) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('addRfqItem error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const submitRfq = async (req, res) => {
  try {
    const rfq = await rfqService.submitRfq(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    if (
      error.message.includes('Illegal state transition') ||
      error.message.includes('Cannot submit an empty RFQ')
    ) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('submitRfq error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: { message: 'No file uploaded' } });
    }
    const attachment = await rfqService.uploadAttachment(
      req.user.id,
      req.params.id,
      req.file
    );
    res.status(201).json({ success: true, data: attachment });
  } catch (error) {
    if (error.message.includes('Can only attach files to DRAFT RFQs')) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('uploadAttachment error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const createQuote = async (req, res) => {
  try {
    const validatedData = quoteSchema.parse(req.body);
    // In a real scenario we'd check if req.user is an admin
    const quote = await rfqService.createQuote(
      req.user.id,
      req.params.id,
      validatedData
    );
    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    if (error.message.includes('Illegal state transition')) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('createQuote error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const acceptQuote = async (req, res) => {
  try {
    const order = await rfqService.acceptQuote(
      req.user.id,
      req.params.id,
      req.params.quoteId
    );
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (
      error.message.includes('Quote not found') ||
      error.message.includes('Illegal state transition')
    ) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('acceptQuote error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
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

  getRfqQuotes: async (req, res) => {
    try {
      const { id } = req.params;
      const quotes = await rfqService.getRfqQuotes(id, req.user.id);
      res.status(200).json({ success: true, data: quotes });
    } catch (error) {
      if (
        error.message === 'RFQ not found' ||
        error.message === 'Unauthorized'
      ) {
        return res
          .status(404)
          .json({ success: false, error: { message: error.message } });
      }
      console.error('getRfqQuotes error:', error);
      res
        .status(500)
        .json({ success: false, error: { message: 'Internal server error' } });
    }
  },

  getQuote: async (req, res) => {
    try {
      const { quoteId } = req.params;
      const quote = await rfqService.getQuote(quoteId, req.user.id);
      res.status(200).json({ success: true, data: quote });
    } catch (error) {
      if (
        error.message === 'Quote not found' ||
        error.message === 'Unauthorized'
      ) {
        return res
          .status(404)
          .json({ success: false, error: { message: error.message } });
      }
      console.error('getQuote error:', error);
      res
        .status(500)
        .json({ success: false, error: { message: 'Internal server error' } });
    }
  },

  rejectQuote: async (req, res) => {
    try {
      const { quoteId } = req.params;
      const quote = await rfqService.rejectQuote(quoteId, req.user.id);
      res.status(200).json({ success: true, data: quote });
    } catch (error) {
      if (error.message === 'Only SENT quotes can be rejected') {
        return res
          .status(400)
          .json({ success: false, error: { message: error.message } });
      }
      if (
        error.message === 'Quote not found' ||
        error.message === 'Unauthorized'
      ) {
        return res
          .status(404)
          .json({ success: false, error: { message: error.message } });
      }
      console.error('rejectQuote error:', error);
      res
        .status(500)
        .json({ success: false, error: { message: 'Internal server error' } });
    }
  }
};
