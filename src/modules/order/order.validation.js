const { z } = require('zod');
const { ORDER_STATES } = require('./order.domain');

const updateStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATES))
});

module.exports = { updateStatusSchema };
