const prisma = require('../../infrastructure/database/prismaClient');
const { calculatePriceForProduct } = require('../pricing/pricing.service');
const AppError = require('../../utils/AppError');

const getCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: true }
    });
  }

  let cartSubtotalMinor = 0;
  const items = [];

  for (const item of cart.items) {
    try {
      const pricing = await calculatePriceForProduct(
        item.productId,
        item.quantity
      );
      cartSubtotalMinor += pricing.subtotalMinor;

      items.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        pricing: {
          unitPriceMinor: pricing.unitPriceMinor,
          subtotalMinor: pricing.subtotalMinor,
          currency: pricing.currency
        }
      });
    } catch (error) {
      items.push({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        error: error.message
      });
    }
  }

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    summary: {
      subtotalMinor: cartSubtotalMinor,
      currency: 'USD'
    }
  };
};

const addItem = async (userId, productId, quantity) => {
  await calculatePriceForProduct(productId, quantity);

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId }
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    await calculatePriceForProduct(productId, newQuantity);

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity
      }
    });
  }

  return getCart(userId);
};

const updateItem = async (userId, itemId, quantity) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true }
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError('Item not found in your cart', { code: 'CART_ITEM_NOT_FOUND', statusCode: 404 });
  }

  await calculatePriceForProduct(item.productId, quantity);

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });

  return getCart(userId);
};

const removeItem = async (userId, itemId) => {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true }
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError('Item not found in your cart', { code: 'CART_ITEM_NOT_FOUND', statusCode: 404 });
  }

  await prisma.cartItem.delete({
    where: { id: itemId }
  });

  return getCart(userId);
};

const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  }
  return getCart(userId);
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,

  validateCart: async (userId) => {
    // Basic validation implementation:
    // Normally this checks stock availability and price changes
    const cart = await getCart(userId);
    if (!cart) {
      throw new AppError('Cart not found', { code: 'CART_NOT_FOUND', statusCode: 404 });
    }

    // Perform any checks here (e.g. min order qty, which is already enforced on add/update)
    const issues = [];
    cart.items.forEach((item) => {
      if (item.quantity < item.product.minOrderQuantity) {
        issues.push(
          `Product ${item.product.name} requires minimum ${item.product.minOrderQuantity} items.`
        );
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
};
