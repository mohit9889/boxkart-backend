const { z } = require('zod');

const calculateSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});

module.exports = { calculateSchema };
