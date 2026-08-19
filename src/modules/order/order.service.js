const prisma = require('../../infrastructure/database/prismaClient');
const {
  selectApplicablePriceTier,
  calculateSubtotal
} = require('../pricing/pricing.domain');
const { validateTransition } = require('./order.domain');
const AppError = require('../../utils/AppError');
const crypto = require('crypto');

const createOrder = async (
  userId,
  shippingAddressId,
  shippingAddressData,
  billingAddressId,
  billingAddressData,
  idempotencyKey
) => {
  return await prisma.$transaction(async (tx) => {
    if (idempotencyKey) {
      const existingOrder = await tx.order.findUnique({
        where: { idempotencyKey },
        include: { items: true, payments: true }
      });
      if (existingOrder) {
        if (existingOrder.userId !== userId) {
          throw new AppError('Idempotency key already in use', {
            code: 'IDEMPOTENCY_CONFLICT',
            statusCode: 409
          });
        }
        return existingOrder;
      }
    }

    let shippingAddress;
    if (shippingAddressId) {
      shippingAddress = await tx.address.findUnique({
        where: { id: shippingAddressId }
      });
      if (!shippingAddress || shippingAddress.userId !== userId) {
        throw new AppError('Invalid shipping address', {
          code: 'VALIDATION_ERROR',
          statusCode: 400
        });
      }
    } else {
      shippingAddress = await tx.address.create({
        data: {
          userId,
          fullName: shippingAddressData.fullName,
          phone: shippingAddressData.phone,
          addressLine1: shippingAddressData.line1,
          addressLine2: shippingAddressData.line2,
          city: shippingAddressData.city,
          state: shippingAddressData.state,
          postalCode: shippingAddressData.pincode,
          country: 'IN'
        }
      });
    }

    let billingAddress = shippingAddress;
    if (billingAddressId && billingAddressId !== shippingAddressId) {
      billingAddress = await tx.address.findUnique({
        where: { id: billingAddressId }
      });
      if (!billingAddress || billingAddress.userId !== userId) {
        throw new AppError('Invalid billing address', {
          code: 'VALIDATION_ERROR',
          statusCode: 400
        });
      }
    } else if (billingAddressData) {
      billingAddress = await tx.address.create({
        data: {
          userId,
          fullName: billingAddressData.fullName,
          phone: billingAddressData.phone,
          addressLine1: billingAddressData.line1,
          addressLine2: billingAddressData.line2,
          city: billingAddressData.city,
          state: billingAddressData.state,
          postalCode: billingAddressData.pincode,
          country: 'IN'
        }
      });
    }

    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', {
        code: 'VALIDATION_ERROR',
        statusCode: 400
      });
    }

    let subtotalMinor = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { priceTiers: true, inventory: true }
      });

      if (!product || product.status !== 'ACTIVE') {
        throw new AppError(`Product ${item.product.sku} is not active`, {
          code: 'PRODUCT_INACTIVE',
          statusCode: 400
        });
      }

      const matchingTier = selectApplicablePriceTier(
        item.quantity,
        product.priceTiers
      );
      if (!matchingTier) {
        throw new AppError(
          `Minimum order quantity not met for ${product.sku}`,
          { code: 'BELOW_MOQ', statusCode: 400 }
        );
      }

      if (!product.inventory) {
        throw new AppError(`Insufficient stock for ${product.sku}`, {
          code: 'INSUFFICIENT_INVENTORY',
          statusCode: 409
        });
      }

      const updateResult = await tx.inventory.updateMany({
        where: {
          productId: product.id,
          availableQuantity: {
            gte: item.quantity
          }
        },
        data: {
          availableQuantity: { decrement: item.quantity },
          reservedQuantity: { increment: item.quantity }
        }
      });

      if (updateResult.count !== 1) {
        throw new AppError(`Insufficient stock for ${product.sku}`, {
          code: 'INSUFFICIENT_INVENTORY',
          statusCode: 409
        });
      }

      const unitPriceMinor = matchingTier.unitPriceMinor;
      const itemSubtotalMinor = calculateSubtotal(
        unitPriceMinor,
        item.quantity
      );

      subtotalMinor += itemSubtotalMinor;

      orderItemsData.push({
        productId: item.productId,
        skuSnapshot: item.product.sku,
        nameSnapshot: item.product.name,
        quantity: item.quantity,
        unitPriceMinor,
        totalMinor: itemSubtotalMinor,
        productSnapshot: item.product
      });
    }

    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let order;
    try {
      order = await tx.order.create({
        data: {
          orderNumber,
          idempotencyKey,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotalMinor: subtotalMinor,
          totalMinor: subtotalMinor, // Simplification for MVP
          currency: 'INR',
          shippingAddressSnapshot: shippingAddress,
          billingAddressSnapshot: billingAddress,
          items: {
            create: orderItemsData
          },
          payments: {
            create: {
              provider: 'MANUAL',
              status: 'PENDING',
              amountMinor: subtotalMinor,
              method: 'COD',
              currency: 'INR'
            }
          }
        },
        include: {
          items: true,
          payments: true
        }
      });
    } catch (error) {
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('idempotencyKey')
      ) {
        throw new AppError('Idempotency key already in use', {
          code: 'IDEMPOTENCY_CONFLICT',
          statusCode: 409
        });
      }
      throw error;
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  });
};

const getUserOrders = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: parseInt(limit, 10),
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true }
    }),
    prisma.order.count({ where: { userId } })
  ]);

  return {
    data: orders,
    meta: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getOrderById = async (userId, orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true
    }
  });

  if (!order || order.userId !== userId) {
    throw new AppError('Order not found', {
      code: 'ORDER_NOT_FOUND',
      statusCode: 404
    });
  }

  return order;
};

const updateOrderStatus = async (
  userId,
  orderId,
  newStatus,
  userRole = 'CUSTOMER'
) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true
      }
    });

    if (!order) {
      throw new AppError('Order not found', {
        code: 'ORDER_NOT_FOUND',
        statusCode: 404
      });
    }

    if (order.userId !== userId && userRole !== 'ADMIN') {
      throw new AppError('Order not found', {
        code: 'ORDER_NOT_FOUND',
        statusCode: 404
      });
    }

    validateTransition(order.status, newStatus);

    if (
      ['PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].includes(
        newStatus
      )
    ) {
      const isCod = order.payments?.some((p) => p.method === 'COD');
      if (order.paymentStatus !== 'PAID' && !isCod) {
        throw new AppError('Cannot process unpaid order unless COD', {
          code: 'PAYMENT_REQUIRED',
          statusCode: 400
        });
      }
    }

    if (newStatus === 'CANCELLED' || newStatus === 'FAILED') {
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            availableQuantity: { increment: item.quantity },
            reservedQuantity: { decrement: item.quantity }
          }
        });
      }
    }

    return await tx.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: { items: true, payments: true }
    });
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
};
