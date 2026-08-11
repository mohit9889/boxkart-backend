const { z } = require('zod');

const rfqSchema = z.object({
  packagingType: z.string().optional(),
  requiredQuantity: z.number().int().positive(),
  deliveryPostalCode: z.string().min(5).optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  requiredDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(1000).optional()
});

const rfqItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().optional(),
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.enum(['MM', 'CM', 'INCH']).optional(),
  quantity: z.number().int().positive(),
  material: z.string().optional(),
  ply: z.number().int().positive().optional(),
  flute: z.string().optional(),
  printing: z.string().optional(),
  finishing: z.string().optional(),
  notes: z.string().max(1000).optional()
});

const quoteSchema = z.object({
  validUntil: z.string().datetime().optional(),
  subtotalMinor: z.number().int().nonnegative(),
  discountMinor: z.number().int().nonnegative().optional(),
  shippingMinor: z.number().int().nonnegative().optional(),
  taxMinor: z.number().int().nonnegative().optional(),
  totalMinor: z.number().int().nonnegative()
});

module.exports = {
  rfqSchema,
  rfqItemSchema,
  quoteSchema
};
