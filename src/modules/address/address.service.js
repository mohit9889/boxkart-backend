const prisma = require('../../infrastructure/database/prismaClient');

const getAddresses = async (userId) => {
  return await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

const createAddress = async (userId, data) => {
  // If isDefault is true, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  return await prisma.address.create({
    data: {
      userId,
      label: data.label,
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      landmark: data.landmark,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || 'IN',
      isDefault: data.isDefault || false
    }
  });
};

const deleteAddress = async (userId, addressId) => {
  return await prisma.address.deleteMany({
    where: {
      id: addressId,
      userId
    }
  });
};

const updateAddress = async (userId, addressId, data) => {
  // If isDefault is true, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false }
    });
  }

  return await prisma.address.updateMany({
    where: { id: addressId, userId },
    data
  });
};

module.exports = {
  getAddresses,
  createAddress,
  deleteAddress,
  updateAddress
};
