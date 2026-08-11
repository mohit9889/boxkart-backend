const prisma = require('../../infrastructure/database/prismaClient');
const { calculatePriceForProduct } = require('../pricing/pricing.service');
const { validateTransition } = require('./order.domain');
const crypto = require('crypto');

const createOrder = async (userId) => {
  return await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    let subtotalMinor = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      const pricing = await calculatePriceForProduct(
        item.productId,
        item.quantity
      );

      subtotalMinor += pricing.subtotalMinor;

      orderItemsData.push({
        productId: item.productId,
        skuSnapshot: item.product.sku,
        nameSnapshot: item.product.name,
        quantity: item.quantity,
        unitPriceMinor: pricing.unitPriceMinor,
        totalMinor: pricing.subtotalMinor,
        productSnapshot: item.product
      });
    }

    const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotalMinor: subtotalMinor,
        totalMinor: subtotalMinor, // Simplification for MVP
        currency: 'INR',
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
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

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return order;
  });
};

const getUserOrders = async (userId) => {
  return await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: true
    }
  });
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
    throw new Error('Order not found');
  }

  return order;
};

const updateOrderStatus = async (userId, orderId, newStatus) => {
  const order = await getOrderById(userId, orderId);

  validateTransition(order.status, newStatus);

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: { items: true, payments: true }
  });
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus
};
