const { z } = require('zod');

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z
    .enum([
      'popular',
      'price-asc',
      'price-desc',
      'best-value',
      'moq-asc',
      'name',
      'createdAt:asc',
      'createdAt:desc'
    ])
    .optional()
    .default('popular'),
  productType: z.string().optional(),
  ply: z.coerce.number().int().positive().optional(),
  size: z.enum(['small', 'medium', 'large']).optional()
});

module.exports = {
  productQuerySchema
};
