const { z } = require('zod');

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive()
});

module.exports = { itemSchema, updateItemSchema };
