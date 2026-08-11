const prisma = require('../../infrastructure/database/prismaClient');
const AppError = require('../../utils/AppError');

const handleP2002 = (error, resource) => {
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'Field';
    throw new AppError(`${resource} with this ${field} already exists.`, { code: 'CONFLICT', statusCode: 409 });
  }
  throw error;
};
const createCategory = async (data) => {
  try {
    return await prisma.category.create({ data });
  } catch (error) {
    handleP2002(error, 'Category');
  }
};

const updateCategory = async (id, data) => {
  try {
    return await prisma.category.update({ where: { id }, data });
  } catch (error) {
    handleP2002(error, 'Category');
  }
};

const createProduct = async (data) => {
  try {
    return await prisma.product.create({ data });
  } catch (error) {
    handleP2002(error, 'Product');
  }
};

const updateProduct = async (id, data) => {
  try {
    return await prisma.product.update({ where: { id }, data });
  } catch (error) {
    handleP2002(error, 'Product');
  }
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
