const { z } = require('zod');

/* ── Category ── */

const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  longDescription: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional()
});

const updateCategorySchema = createCategorySchema.partial();

/* ── Supplier ── */

const createSupplierSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string().max(500).optional(),
  rating: z.number().min(0).max(5).optional(),
  leadTime: z.string().max(100).optional(),
  verified: z.boolean().optional()
});

const updateSupplierSchema = createSupplierSchema.partial();

/* ── Product ── */

const boxSpecificationSchema = z.object({
  internalLength: z.number().positive(),
  internalWidth: z.number().positive(),
  internalHeight: z.number().positive(),
  externalLength: z.number().positive().optional(),
  externalWidth: z.number().positive().optional(),
  externalHeight: z.number().positive().optional(),
  dimensionUnit: z.enum(['MM', 'CM', 'INCH']).default('INCH'),
  material: z.string().optional(),
  ply: z.number().int().positive().optional(),
  flute: z.string().optional(),
  gsm: z.number().int().positive().optional(),
  maxRecommendedWeight: z.number().positive().optional(),
  weightUnit: z.enum(['GRAM', 'KG', 'LB']).optional(),
  boxStyle: z.string().optional(),
  closureType: z.string().optional(),
  printingSupported: z.boolean().optional(),
  customizationSupported: z.boolean().optional()
});

const priceTierSchema = z.object({
  minimumQuantity: z.number().int().positive(),
  maximumQuantity: z.number().int().positive().optional(),
  unitPriceMinor: z.number().int().positive(),
  currency: z.string().default('INR')
});

const productImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  imageType: z
    .enum(['product', 'blueprint', 'lifestyle', 'detail'])
    .default('product'),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false)
});

const inventorySchema = z.object({
  availableQuantity: z.number().int().min(0).default(0),
  reservedQuantity: z.number().int().min(0).default(0),
  status: z
    .enum(['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'])
    .default('AVAILABLE')
});

const createProductSchema = z.object({
  sku: z.string().min(3).max(50),
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'])
    .default('DRAFT'),
  productType: z.enum([
    'CORRUGATED_BOX',
    'MAILER_BOX',
    'PAPER_MAILER',
    'BUBBLE_MAILER',
    'COURIER_BAG',
    'TAPE',
    'STRETCH_FILM',
    'BUBBLE_WRAP',
    'FOAM',
    'VOID_FILL',
    'INSERT',
    'STICKER',
    'LABEL',
    'CARD',
    'OTHER'
  ]),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid().optional().nullable(),
  // FE-visible fields
  color: z.string().max(100).optional(),
  useCases: z.array(z.string()).optional().default([]),
  deliveryEstimate: z.string().max(100).optional(),
  stockStatus: z.string().max(100).optional(),
  dimensions: z.string().max(100).optional(),
  notRecommendedFor: z.array(z.string()).optional().default([]),
  moq: z.number().int().positive().default(100),
  unit: z.string().default('piece'),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['GRAM', 'KG', 'LB']).optional(),
  // Nested relations
  boxSpecification: boxSpecificationSchema.optional(),
  priceTiers: z.array(priceTierSchema).optional(),
  images: z.array(productImageSchema).optional(),
  inventory: inventorySchema.optional()
});

const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(200).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  productType: z
    .enum([
      'CORRUGATED_BOX',
      'MAILER_BOX',
      'PAPER_MAILER',
      'BUBBLE_MAILER',
      'COURIER_BAG',
      'TAPE',
      'STRETCH_FILM',
      'BUBBLE_WRAP',
      'FOAM',
      'VOID_FILL',
      'INSERT',
      'STICKER',
      'LABEL',
      'CARD',
      'OTHER'
    ])
    .optional(),
  categoryId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional().nullable(),
  color: z.string().max(100).optional(),
  useCases: z.array(z.string()).optional(),
  deliveryEstimate: z.string().max(100).optional(),
  stockStatus: z.string().max(100).optional(),
  dimensions: z.string().max(100).optional(),
  notRecommendedFor: z.array(z.string()).optional(),
  moq: z.number().int().positive().optional(),
  unit: z.string().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['GRAM', 'KG', 'LB']).optional(),
  // Nested replacements
  boxSpecification: boxSpecificationSchema.optional(),
  priceTiers: z.array(priceTierSchema).optional(),
  images: z.array(productImageSchema).optional(),
  inventory: inventorySchema.optional()
});

/* ── Order / RFQ status ── */

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_TO_SHIP',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'FAILED',
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
  createSupplierSchema,
  updateSupplierSchema,
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  updateRfqStatusSchema
};
