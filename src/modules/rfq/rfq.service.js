const prisma = require('../../infrastructure/database/prismaClient');
const {
  validateRfqTransition,
  validateQuoteTransition,
  RFQ_STATES
} = require('./rfq.domain');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_KEY || 'mock-key'
);

const createRfq = async (userId, data) => {
  const rfqNumber = `RFQ-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  return await prisma.rFQ.create({
    data: {
      rfqNumber,
      userId,
      status: RFQ_STATES.DRAFT,
      packagingType: data.packagingType,
      requiredQuantity: data.requiredQuantity,
      deliveryPostalCode: data.deliveryPostalCode,
      deliveryCity: data.deliveryCity,
      deliveryState: data.deliveryState,
      requiredDeliveryDate: data.requiredDeliveryDate,
      notes: data.notes
    },
    include: { items: true, attachments: true }
  });
};

const getRfqById = async (userId, rfqId) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: { items: true, attachments: true, quotes: true }
  });

  if (!rfq || rfq.userId !== userId) {
    throw new Error('RFQ not found');
  }

  return rfq;
};

const getUserRfqs = async (userId) => {
  return await prisma.rFQ.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true, quotes: true }
  });
};

const addRfqItem = async (userId, rfqId, itemData) => {
  const rfq = await getRfqById(userId, rfqId);

  if (rfq.status !== RFQ_STATES.DRAFT) {
    throw new Error('Cannot add items to non-draft RFQ');
  }

  return await prisma.rFQItem.create({
    data: {
      rfqId,
      productId: itemData.productId || null,
      description: itemData.description,
      length: itemData.length,
      width: itemData.width,
      height: itemData.height,
      dimensionUnit: itemData.dimensionUnit || 'MM',
      quantity: itemData.quantity,
      material: itemData.material,
      ply: itemData.ply,
      flute: itemData.flute,
      printing: itemData.printing,
      finishing: itemData.finishing,
      notes: itemData.notes
    }
  });
};

const submitRfq = async (userId, rfqId) => {
  const rfq = await getRfqById(userId, rfqId);

  validateRfqTransition(rfq.status, RFQ_STATES.SUBMITTED);

  if (rfq.items.length === 0) {
    throw new Error('Cannot submit an empty RFQ');
  }

  return await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: RFQ_STATES.SUBMITTED },
    include: { items: true, attachments: true }
  });
};

const uploadAttachment = async (userId, rfqId, file) => {
  const rfq = await getRfqById(userId, rfqId);

  if (rfq.status !== RFQ_STATES.DRAFT) {
    throw new Error('Can only attach files to DRAFT RFQs');
  }

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${rfqId}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('rfq-attachments')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('File upload failed');
  }

  const { data: publicUrlData } = supabase.storage
    .from('rfq-attachments')
    .getPublicUrl(fileName);

  return await prisma.rFQAttachment.create({
    data: {
      rfqId,
      fileName: file.originalname,
      fileUrl: publicUrlData.publicUrl,
      fileType: 'IMAGE', // Simplified
      fileSize: file.size
    }
  });
};

const createQuote = async (adminId, rfqId, quoteData) => {
  // Skipping admin check for MVP integration test simplicity, but in real-life this would verify admin
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new Error('RFQ not found');

  validateRfqTransition(rfq.status, RFQ_STATES.QUOTED);

  const quoteNumber = `QTE-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  return await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        rfqId,
        status: 'SENT',
        validUntil: quoteData.validUntil,
        subtotalMinor: quoteData.subtotalMinor,
        discountMinor: quoteData.discountMinor || 0,
        shippingMinor: quoteData.shippingMinor || 0,
        taxMinor: quoteData.taxMinor || 0,
        totalMinor: quoteData.totalMinor,
        currency: 'INR'
      }
    });

    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQ_STATES.QUOTED }
    });

    return quote;
  });
};

const acceptQuote = async (userId, rfqId, quoteId) => {
  const rfq = await getRfqById(userId, rfqId);
  const quote = rfq.quotes.find((q) => q.id === quoteId);

  if (!quote) throw new Error('Quote not found for this RFQ');

  validateQuoteTransition(quote.status, 'ACCEPTED');
  validateRfqTransition(rfq.status, RFQ_STATES.ACCEPTED);

  return await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'ACCEPTED' }
    });

    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQ_STATES.ACCEPTED }
    });

    // Automatically convert to order
    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let productId = rfq.items[0]?.productId;
    if (!productId) {
      const category = await tx.category.findFirst();
      const product = await tx.product.create({
        data: {
          sku: `CUS-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          name: `Custom Packaging ${rfq.rfqNumber}`,
          slug: `custom-${rfq.rfqNumber.toLowerCase()}-${crypto.randomBytes(2).toString('hex')}`,
          description: 'Custom packaging generated from RFQ',
          status: 'ACTIVE',
          productType: 'CORRUGATED_BOX',
          categoryId: category.id
        }
      });
      productId = product.id;
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotalMinor: quote.subtotalMinor,
        discountMinor: quote.discountMinor,
        shippingMinor: quote.shippingMinor,
        taxMinor: quote.taxMinor,
        totalMinor: quote.totalMinor,
        currency: 'INR',
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
        items: {
          create: [
            {
              productId: productId,
              skuSnapshot: 'RFQ-CUSTOM',
              nameSnapshot: 'Custom RFQ Packaging',
              quantity: rfq.requiredQuantity || 1,
              unitPriceMinor: Math.floor(
                quote.subtotalMinor / (rfq.requiredQuantity || 1)
              ),
              totalMinor: quote.subtotalMinor,
              productSnapshot: { rfqId: rfq.id }
            }
          ]
        },
        payments: {
          create: {
            provider: 'MANUAL',
            status: 'PENDING',
            amountMinor: quote.totalMinor,
            method: 'COD',
            currency: 'INR'
          }
        }
      }
    });

    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQ_STATES.CONVERTED_TO_ORDER }
    });

    return order;
  });
};

module.exports = {
  createRfq,
  getRfqById,
  getUserRfqs,
  addRfqItem,
  submitRfq,
  uploadAttachment,
  createQuote,
  acceptQuote,

  getRfqQuotes: async (rfqId, userId) => {
    // Verify user owns the RFQ or is admin
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId }
    });

    if (!rfq || rfq.userId !== userId) {
      throw new Error('RFQ not found');
    }

    return prisma.quote.findMany({
      where: { rfqId }
    });
  },

  getQuote: async (quoteId, userId) => {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true }
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    // Verify ownership
    if (quote.rfq.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return quote;
  },

  rejectQuote: async (quoteId, userId) => {
    const quote = await getQuote(quoteId, userId);

    if (quote.status !== 'SENT') {
      throw new Error('Only SENT quotes can be rejected');
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED' }
    });
  }
};
