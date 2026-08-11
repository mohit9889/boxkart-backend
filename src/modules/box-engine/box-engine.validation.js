const { z } = require('zod');

const recommendSchema = z.object({
  product: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.enum(['INCH', 'CM', 'MM']),
    weight: z.number().positive().optional(),
    weightUnit: z.enum(['KG', 'GRAM', 'LB', 'OZ']).optional()
  }),
  requirements: z
    .object({
      quantity: z.number().int().positive().default(1),
      fragile: z.boolean().optional(),
      printingRequired: z.boolean().optional()
    })
    .optional()
    .default({ quantity: 1 }),
  preferences: z
    .object({
      priority: z
        .enum(['LOWEST_PRICE', 'BEST_FIT', 'BEST_PROTECTION', 'BALANCED'])
        .default('BALANCED')
    })
    .optional()
    .default({ priority: 'BALANCED' })
});

module.exports = { recommendSchema };
