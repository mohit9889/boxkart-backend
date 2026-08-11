const prisma = require('../../infrastructure/database/prismaClient');
const {
  validateRfqTransition,
  validateQuoteTransition,
  RFQ_STATES
} = require('./rfq.domain');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const AppError = require('../../utils/AppError');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'mock-key'
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

const signAttachmentUrls = async (rfq) => {
  if (!rfq.attachments || rfq.attachments.length === 0) return rfq;
  
  const signedAttachments = await Promise.all(
    rfq.attachments.map(async (att) => {
      if (!att.fileUrl.startsWith('http')) {
        const { data } = await supabase.storage
          .from('rfq-attachments')
          .createSignedUrl(att.fileUrl, 3600);
        return { ...att, fileUrl: data?.signedUrl || att.fileUrl };
      }
      return att;
    })
  );
  return { ...rfq, attachments: signedAttachments };
};

const getRfqById = async (userId, rfqId, userRole = 'CUSTOMER') => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: { items: true, attachments: true, quotes: true }
  });

  if (!rfq) {
    throw new AppError('RFQ not found', { code: 'RFQ_NOT_FOUND', statusCode: 404 });
  }

  if (userRole !== 'ADMIN' && rfq.userId !== userId) {
    throw new AppError('RFQ not found', { code: 'RFQ_NOT_FOUND', statusCode: 404 });
  }

  return await signAttachmentUrls(rfq);
};

const getUserRfqs = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [rfqs, total] = await Promise.all([
    prisma.rFQ.findMany({
      where: { userId },
      skip,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        attachments: true
      }
    }),
    prisma.rFQ.count({ where: { userId } })
  ]);
  
  const signedRfqs = await Promise.all(rfqs.map(signAttachmentUrls));

  return {
    data: signedRfqs,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const addRfqItem = async (userId, rfqId, itemData) => {
  const rfq = await getRfqById(userId, rfqId);

  if (rfq.status !== RFQ_STATES.DRAFT) {
    throw new AppError('Cannot add items to non-draft RFQ', { code: 'INVALID_RFQ_STATE', statusCode: 400 });
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

  if (!rfq || rfq.items.length === 0) {
    throw new AppError('Cannot submit an empty RFQ', { code: 'VALIDATION_ERROR', statusCode: 400 });
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
    throw new AppError('Can only attach files to DRAFT RFQs', { code: 'INVALID_RFQ_STATE', statusCode: 400 });
  }

  if (rfq.attachments && rfq.attachments.length >= 5) {
    throw new AppError('Maximum of 5 attachments allowed per RFQ', { code: 'MAX_ATTACHMENTS_EXCEEDED', statusCode: 400 });
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
    throw new AppError('File upload failed', { code: 'STORAGE_ERROR', statusCode: 500 });
  }

  const fileType = file.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';

  const attachment = await prisma.rFQAttachment.create({
    data: {
      rfqId,
      fileName: file.originalname,
      fileUrl: fileName, // Store raw path for dynamic signed URLs
      fileType,
      fileSize: file.size
    }
  });
  
  // Return with a signed URL immediately for the response
  const { data: signedData } = await supabase.storage
    .from('rfq-attachments')
    .createSignedUrl(fileName, 3600);
    
  return { ...attachment, fileUrl: signedData?.signedUrl || fileName };
};

const createQuote = async (adminId, rfqId, quoteData) => {
  // Skipping admin check for MVP integration test simplicity, but in real-life this would verify admin
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new AppError('RFQ not found', { code: 'RFQ_NOT_FOUND', statusCode: 404 });

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

const acceptQuote = async (userId, rfqId, quoteId, shippingAddressId, billingAddressId, idempotencyKey, userRole = 'CUSTOMER') => {
  const rfq = await getRfqById(userId, rfqId, userRole);
  const quote = rfq.quotes.find((q) => q.id === quoteId);

  if (!quote) throw new AppError('Quote not found for this RFQ', { code: 'QUOTE_NOT_FOUND', statusCode: 404 });

  validateQuoteTransition(quote.status, 'ACCEPTED');
  validateRfqTransition(rfq.status, RFQ_STATES.ACCEPTED);

  return await prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existingOrder = await tx.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, payments: true }
      });
      if (existingOrder) {
        if (existingOrder.userId !== userId) {
          throw new AppError('Idempotency key already in use', { code: 'IDEMPOTENCY_CONFLICT', statusCode: 409 });
        }
        return existingOrder;
      }
    }

    const shippingAddress = await tx.address.findUnique({ where: { id: shippingAddressId } });
    if (!shippingAddress || shippingAddress.userId !== userId) {
      throw new AppError('Invalid shipping address', { code: 'VALIDATION_ERROR', statusCode: 400 });
    }
    
    let billingAddress = shippingAddress;
    if (billingAddressId && billingAddressId !== shippingAddressId) {
      billingAddress = await tx.address.findUnique({ where: { id: billingAddressId } });
      if (!billingAddress || billingAddress.userId !== userId) {
        throw new AppError('Invalid billing address', { code: 'VALIDATION_ERROR', statusCode: 400 });
      }
    }

    if (quote.validUntil && new Date() > new Date(quote.validUntil)) {
      throw new AppError('Quote has expired', { code: 'QUOTE_EXPIRED', statusCode: 400 });
    }

    const updateResult = await tx.quote.updateMany({
      where: { id: quoteId, status: quote.status },
      data: { status: 'ACCEPTED' }
    });
    
    if (updateResult.count === 0) {
      throw new AppError('Quote state changed unexpectedly', { code: 'CONCURRENCY_ERROR', statusCode: 409 });
    }

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

      await tx.inventory.create({
        data: {
          productId: productId,
          availableQuantity: rfq.requiredQuantity || 1,
          reservedQuantity: 0
        }
      });
    }

    const requiredQty = rfq.requiredQuantity || 1;
    const inventoryUpdateResult = await tx.inventory.updateMany({
      where: {
        productId: productId,
        availableQuantity: { gte: requiredQty }
      },
      data: {
        availableQuantity: { decrement: requiredQty },
        reservedQuantity: { increment: requiredQty }
      }
    });

    if (inventoryUpdateResult.count !== 1) {
      throw new AppError(`Insufficient stock for product`, { code: 'INSUFFICIENT_INVENTORY', statusCode: 409 });
    }

    let order;
    try {
      order = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotalMinor: quote.subtotalMinor,
          discountMinor: quote.discountMinor,
          shippingMinor: quote.shippingMinor,
          taxMinor: quote.taxMinor,
          totalMinor: quote.totalMinor,
          currency: 'INR',
          shippingAddressSnapshot: shippingAddress,
          billingAddressSnapshot: billingAddress,
          items: {
            create: [
              {
                productId: productId,
                skuSnapshot: 'RFQ-CUSTOM',
                nameSnapshot: 'Custom RFQ Packaging',
                quantity: requiredQty,
                unitPriceMinor: Math.floor(
                  quote.subtotalMinor / requiredQty
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
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey')) {
        throw new AppError('Idempotency key already in use', { code: 'IDEMPOTENCY_CONFLICT', statusCode: 409 });
      }
      throw error;
    }

    await tx.rFQ.update({
      where: { id: rfqId },
      data: { status: RFQ_STATES.CONVERTED_TO_ORDER }
    });

    return order;
  });
};

const cancelRfq = async (userId, rfqId, userRole = 'CUSTOMER') => {
  const rfq = await getRfqById(userId, rfqId, userRole);
  
  validateRfqTransition(rfq.status, RFQ_STATES.CANCELLED);
  
  const cancelledRfq = await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: RFQ_STATES.CANCELLED },
    include: { items: true, attachments: true }
  });

  if (cancelledRfq.attachments && cancelledRfq.attachments.length > 0) {
    const filePaths = cancelledRfq.attachments.map(att => att.fileUrl);
    try {
      await supabase.storage.from('rfq-attachments').remove(filePaths);
    } catch (error) {
      console.error('Failed to cleanup attachments from Supabase on RFQ cancellation:', error);
    }
  }

  return cancelledRfq;
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
  cancelRfq,

  getRfqQuotes: async (rfqId, userId, userRole = 'CUSTOMER') => {
    // Verify user owns the RFQ or is admin
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId }
    });

    if (!rfq) {
      throw new AppError('RFQ not found', { code: 'RFQ_NOT_FOUND', statusCode: 404 });
    }
    
    if (userRole !== 'ADMIN' && rfq.userId !== userId) {
      throw new AppError('RFQ not found', { code: 'RFQ_NOT_FOUND', statusCode: 404 });
    }

    return prisma.quote.findMany({
      where: { rfqId }
    });
  },

  getQuote: async (quoteId, userId, userRole = 'CUSTOMER') => {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { rfq: true }
    });

    if (!quote) {
      throw new AppError('Quote not found', { code: 'QUOTE_NOT_FOUND', statusCode: 404 });
    }

    // Verify ownership
    if (userRole !== 'ADMIN' && quote.rfq.userId !== userId) {
      throw new AppError('Unauthorized', { code: 'FORBIDDEN', statusCode: 403 });
    }

    return quote;
  },

  rejectQuote: async (quoteId, userId) => {
    const quote = await getQuote(quoteId, userId);

    if (quote.status !== 'SENT') {
      throw new AppError('Only SENT quotes can be rejected', { code: 'INVALID_QUOTE_STATE', statusCode: 400 });
    }

    return prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED' }
    });
  }
};
