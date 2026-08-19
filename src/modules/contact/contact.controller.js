const contactService = require('./contact.service');
const AppError = require('../../utils/AppError');
const { z } = require('zod');

/** Validation schema for the public contact form */
const contactSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  inquiryType: z.string().default('Other'),
  message: z.string().min(5, 'Message is required')
});

/**
 * POST /api/v1/contact
 * Creates a generic contact message from the "Contact Us" form.
 */
const submitContactForm = async (req, res, next) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const message = await contactService.createContactMessage(validatedData);
    res.status(201).json({ success: true, data: message });
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
  submitContactForm
};
