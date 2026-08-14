const prisma = require('../../infrastructure/database/prismaClient');
const AppError = require('../../utils/AppError');

/** Handles Prisma unique-constraint violations. */
const handleP2002 = (error, resource) => {
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'Field';
    throw new AppError(`${resource} with this ${field} already exists.`, { code: 'CONFLICT', statusCode: 409 });
  }
  throw error;
};

/* ── Category ── */

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

const deleteCategory = async (id) => {
  return prisma.category.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });
};

const getCategories = async (page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take: limit,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    }),
    prisma.category.count()
  ]);
  return {
    categories: categories.map((c) => ({
      ...c,
      productCount: c._count.products,
      _count: undefined
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

/* ── Supplier ── */

const createSupplier = async (data) => {
  return prisma.supplier.create({ data });
};

const updateSupplier = async (id, data) => {
  return prisma.supplier.update({ where: { id }, data });
};

const getSuppliers = async () => {
  return prisma.supplier.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { products: true } }
    }
  });
};

/* ── Product ── */

/**
 * Create a product with optional nested BoxSpecification, PriceTiers,
 * Images, and Inventory in a single transaction.
 */
const createProduct = async (data) => {
  const {
    boxSpecification,
    priceTiers,
    images,
    inventory,
    ...productData
  } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      // Create the product
      const product = await tx.product.create({
        data: {
          ...productData,
          ...(boxSpecification && {
            boxSpecification: { create: boxSpecification }
          }),
          ...(priceTiers?.length && {
            priceTiers: { create: priceTiers }
          }),
          ...(images?.length && {
            images: { create: images }
          }),
          ...(inventory && {
            inventory: { create: inventory }
          })
        },
        include: {
          category: true,
          supplier: true,
          boxSpecification: true,
          priceTiers: { orderBy: { minimumQuantity: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' } },
          inventory: true
        }
      });

      return product;
    });
  } catch (error) {
    handleP2002(error, 'Product');
  }
};

/**
 * Update a product with optional nested relation replacements.
 * For priceTiers, images — performs delete-all-then-recreate.
 */
const updateProduct = async (id, data) => {
  const {
    boxSpecification,
    priceTiers,
    images,
    inventory,
    ...productData
  } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      // Update product fields
      const product = await tx.product.update({
        where: { id },
        data: productData
      });

      // Replace BoxSpecification if provided
      if (boxSpecification) {
        await tx.boxSpecification.upsert({
          where: { productId: id },
          update: boxSpecification,
          create: { ...boxSpecification, productId: id }
        });
      }

      // Replace PriceTiers if provided (delete all, recreate)
      if (priceTiers) {
        await tx.productPriceTier.deleteMany({ where: { productId: id } });
        if (priceTiers.length > 0) {
          await tx.productPriceTier.createMany({
            data: priceTiers.map((t) => ({ ...t, productId: id }))
          });
        }
      }

      // Replace Images if provided
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({ ...img, productId: id }))
          });
        }
      }

      // Upsert Inventory if provided
      if (inventory) {
        await tx.inventory.upsert({
          where: { productId: id },
          update: inventory,
          create: { ...inventory, productId: id }
        });
      }

      // Return full product with relations
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          supplier: true,
          boxSpecification: true,
          priceTiers: { orderBy: { minimumQuantity: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' } },
          inventory: true
        }
      });
    });
  } catch (error) {
    handleP2002(error, 'Product');
  }
};

const deleteProduct = async (id) => {
  return prisma.product.update({
    where: { id },
    data: { status: 'DISCONTINUED' }
  });
};

const getProducts = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        supplier: true,
        images: { where: { isPrimary: true }, take: 1 },
        priceTiers: { orderBy: { minimumQuantity: 'asc' }, take: 1 },
        inventory: true
      }
    }),
    prisma.product.count()
  ]);
  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
};

/* ── Orders ── */

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

/* ── RFQs ── */

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
  deleteCategory,
  getCategories,
  createSupplier,
  updateSupplier,
  getSuppliers,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getOrders,
  updateOrderStatus,
  getRfqs,
  updateRfqStatus
};
