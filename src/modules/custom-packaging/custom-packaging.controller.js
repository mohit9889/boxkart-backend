const rfqService = require('../rfq/rfq.service');
const { rfqItemSchema } = require('../rfq/rfq.validation');
const guestInquiryService = require('./guest-inquiry.service');
const AppError = require('../../utils/AppError');
const { z } = require('zod');

/** Validation schema for the public guest inquiry form */
const guestInquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  business: z.string().optional(),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email('A valid email is required'),
  productType: z.string().optional(),
  length: z.coerce.number().positive().optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  unit: z.enum(['INCH', 'CM']).default('INCH'),
  quantity: z.coerce.number().int().positive('Quantity is required'),
  printing: z
    .enum(['none', '1-color', '2-color', 'full-color'])
    .default('none'),
  location: z.string().optional(),
  notes: z.string().optional()
});

/**
 * POST /api/v1/custom-packaging/inquiries (PUBLIC — no auth required)
 * Creates a guest inquiry from the "Need packaging for your brand?" form.
 *
 * TODO: Trigger email notification to the team after successful creation.
 *       See guest-inquiry.service.js for the TODO comment.
 */
const createGuestInquiry = async (req, res, next) => {
  try {
    const validatedData = guestInquirySchema.parse(req.body);
    const inquiry = await guestInquiryService.createGuestInquiry(validatedData);
    res.status(201).json({ success: true, data: inquiry });
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

/**
 * POST /api/v1/custom-packaging/requests (AUTHENTICATED)
 * Creates a full custom packaging request for logged-in users via the RFQ flow.
 */
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

module.exports = {
  createGuestInquiry,
  createCustomPackagingRequest
};
