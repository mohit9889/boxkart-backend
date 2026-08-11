const { z } = require('zod');
const { ORDER_STATES } = require('./order.domain');

const updateStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATES))
});

const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().optional()
});

module.exports = { updateStatusSchema, createOrderSchema };
