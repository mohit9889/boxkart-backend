const prisma = require('../../infrastructure/database/prismaClient');

const createCategory = async (data) => {
  return prisma.category.create({
    data
  });
};

const updateCategory = async (id, data) => {
  return prisma.category.update({
    where: { id },
    data
  });
};

const createProduct = async (data) => {
  return prisma.product.create({
    data
  });
};

const updateProduct = async (id, data) => {
  return prisma.product.update({
    where: { id },
    data
  });
};

const getOrders = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    }),
    prisma.order.count()
  ]);
  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const updateOrderStatus = async (id, status) => {
  return prisma.order.update({
    where: { id },
    data: { status }
  });
};

const getRfqs = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [rfqs, total] = await Promise.all([
    prisma.rFQ.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    }),
    prisma.rFQ.count()
  ]);
  return {
    rfqs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

const updateRfqStatus = async (id, status) => {
  return prisma.rFQ.update({
    where: { id },
    data: { status }
  });
};

module.exports = {
  createCategory,
  updateCategory,
  createProduct,
  updateProduct,
  getOrders,
  updateOrderStatus,
  getRfqs,
  updateRfqStatus
};
