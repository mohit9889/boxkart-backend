const { z } = require('zod');
const { ORDER_STATES } = require('./order.domain');

const updateStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATES))
});

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required').optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
  type: z.enum(['SHIPPING', 'BILLING']).optional()
});

const createOrderSchema = z
  .object({
    shippingAddressId: z.string().uuid().optional(),
    shippingAddress: addressSchema.optional(),
    billingAddressId: z.string().uuid().optional(),
    billingAddress: addressSchema.optional()
  })
  .refine((data) => data.shippingAddressId || data.shippingAddress, {
    message: 'Either shippingAddressId or shippingAddress must be provided'
  });

module.exports = { updateStatusSchema, createOrderSchema };
