const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().optional().nullable()
});

const updateCategorySchema = createCategorySchema.partial();

const createProductSchema = z.object({
  sku: z.string().min(3).max(50),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']),
  productType: z.enum([
    'CORRUGATED_BOX',
    'TAPE',
    'MAILER',
    'VOID_FILL',
    'ACCESSORY'
  ]),
  categoryId: z.string().uuid(),
  // Attributes
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  dimensionUnit: z.enum(['MM', 'CM', 'INCH']).optional(),
  internalLength: z.number().positive().optional(),
  internalWidth: z.number().positive().optional(),
  internalHeight: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['KG', 'G', 'LB', 'OZ']).optional(),
  // Specs
  material: z.string().optional(),
  ply: z.number().int().positive().optional(),
  flute: z.string().optional(),
  burstingStrength: z.number().positive().optional(),
  edgeCrushTest: z.number().positive().optional(),
  // Inventory
  minOrderQuantity: z.number().int().positive().default(1)
});

const updateProductSchema = createProductSchema.partial();

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED'
  ])
});

const updateRfqStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'QUOTED',
    'ACCEPTED',
    'EXPIRED',
    'REJECTED',
    'CANCELLED',
    'CONVERTED_TO_ORDER'
  ])
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  updateRfqStatusSchema
};
