const prisma = require('../../infrastructure/database/prismaClient');

/**
 * Create a new contact message.
 * @param {object} data - Validated contact data
 * @returns {Promise<object>} Created ContactMessage record
 */
const createContactMessage = async (data) => {
  const message = await prisma.contactMessage.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      inquiryType: data.inquiryType,
      message: data.message,
      status: 'NEW'
    }
  });

  // TODO: Trigger email notification to the team

  return message;
};

/**
 * Get all contact messages (admin only).
 */
const listContactMessages = async ({ page = 1, limit = 20, status }) => {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    messages,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createContactMessage,
  listContactMessages
};
