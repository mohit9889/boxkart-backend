const { z } = require('zod');

const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  productType: z.string().optional()
});

module.exports = {
  productQuerySchema
};
