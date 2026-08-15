const prisma = require('../../infrastructure/database/prismaClient');
const AppError = require('../../utils/AppError');

/**
 * Create a new guest inquiry from the Custom Packaging form.
 * No auth required — stores contact info + packaging specs.
 *
 * TODO: Send email notification to the team when a new inquiry is submitted.
 *       Use Resend or Nodemailer. Add SMTP config to .env and trigger here.
 *
 * @param {object} data - Validated inquiry data
 * @returns {Promise<object>} Created GuestInquiry record
 */
const createGuestInquiry = async (data) => {
  const inquiry = await prisma.guestInquiry.create({
    data: {
      name: data.name,
      business: data.business || null,
      phone: data.phone,
      email: data.email,
      productType: data.productType || null,
      length: data.length ? parseFloat(data.length) : null,
      width: data.width ? parseFloat(data.width) : null,
      height: data.height ? parseFloat(data.height) : null,
      unit: data.unit || 'INCH',
      quantity: parseInt(data.quantity, 10),
      printing: data.printing || 'none',
      location: data.location || null,
      notes: data.notes || null,
      status: 'NEW',
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  });

  return inquiry;
};

/**
 * List all guest inquiries (admin only).
 * @param {{ page?: number, limit?: number, status?: string }} opts
 * @returns {Promise<{ data: Array, meta: object }>}
 */
const listGuestInquiries = async ({ page = 1, limit = 20, status } = {}) => {
  const skip = (page - 1) * limit;
  const where = status ? { status } : {};

  const [total, inquiries] = await Promise.all([
    prisma.guestInquiry.count({ where }),
    prisma.guestInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        business: true,
        phone: true,
        email: true,
        productType: true,
        quantity: true,
        printing: true,
        location: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    data: inquiries,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single guest inquiry by ID (admin only).
 * @param {string} id
 * @returns {Promise<object>}
 */
const getGuestInquiryById = async (id) => {
  const inquiry = await prisma.guestInquiry.findUnique({ where: { id } });
  if (!inquiry) {
    throw new AppError('Inquiry not found', { code: 'NOT_FOUND', statusCode: 404 });
  }
  return inquiry;
};

/**
 * Update status of a guest inquiry (admin only).
 * @param {string} id
 * @param {'NEW'|'CONTACTED'|'CLOSED'} status
 * @returns {Promise<object>}
 */
const updateInquiryStatus = async (id, status) => {
  const VALID_STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
  }

  const inquiry = await prisma.guestInquiry.update({
    where: { id },
    data: { status },
  });
  return inquiry;
};

module.exports = {
  createGuestInquiry,
  listGuestInquiries,
  getGuestInquiryById,
  updateInquiryStatus,
};
