const adminService = require('./admin.service');
const validation = require('./admin.validation');
const guestInquiryService = require('../custom-packaging/guest-inquiry.service');
const AppError = require('../../utils/AppError');

/** Standardized Zod error handler for controllers. */
const handleZodError = (error, next) => {
  if (error.name === 'ZodError') {
    return next(
      new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      })
    );
  }
  next(error);
};

/* ── Category ── */

const createCategory = async (req, res, next) => {
  try {
    const data = validation.createCategorySchema.parse(req.body);
    const category = await adminService.createCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    handleZodError(error, next);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const data = validation.updateCategorySchema.parse(req.body);
    const category = await adminService.updateCategory(req.params.id, data);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    handleZodError(error, next);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await adminService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await adminService.getCategories(page, limit);
    res
      .status(200)
      .json({
        success: true,
        data: result.categories,
        meta: result.pagination
      });
  } catch (error) {
    next(error);
  }
};

/* ── Supplier ── */

const createSupplier = async (req, res, next) => {
  try {
    const data = validation.createSupplierSchema.parse(req.body);
    const supplier = await adminService.createSupplier(data);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    handleZodError(error, next);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const data = validation.updateSupplierSchema.parse(req.body);
    const supplier = await adminService.updateSupplier(req.params.id, data);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    handleZodError(error, next);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await adminService.getSuppliers();
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

/* ── Product ── */

const createProduct = async (req, res, next) => {
  try {
    const data = validation.createProductSchema.parse(req.body);
    const product = await adminService.createProduct(data);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    handleZodError(error, next);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const data = validation.updateProductSchema.parse(req.body);
    const product = await adminService.updateProduct(req.params.id, data);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    handleZodError(error, next);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await adminService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getProducts(page, limit);
    res
      .status(200)
      .json({ success: true, data: result.products, meta: result.pagination });
  } catch (error) {
    next(error);
  }
};

/* ── Orders ── */

const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getOrders(page, limit);
    res
      .status(200)
      .json({ success: true, data: result.orders, meta: result.pagination });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = validation.updateOrderStatusSchema.parse(req.body);
    const order = await adminService.updateOrderStatus(req.params.id, status);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    handleZodError(error, next);
  }
};

/* ── RFQs ── */

const getRfqs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getRfqs(page, limit);
    res
      .status(200)
      .json({ success: true, data: result.rfqs, meta: result.pagination });
  } catch (error) {
    next(error);
  }
};

const updateRfqStatus = async (req, res, next) => {
  try {
    const { status } = validation.updateRfqStatusSchema.parse(req.body);
    const rfq = await adminService.updateRfqStatus(req.params.id, status);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    handleZodError(error, next);
  }
};

/* ── Guest Inquiries ── */

const getGuestInquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await guestInquiryService.listGuestInquiries({
      page,
      limit,
      status
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getGuestInquiry = async (req, res, next) => {
  try {
    const inquiry = await guestInquiryService.getGuestInquiryById(
      req.params.id
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

const updateGuestInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const inquiry = await guestInquiryService.updateInquiryStatus(
      req.params.id,
      status
    );
    res.json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
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
  updateRfqStatus,
  getGuestInquiries,
  getGuestInquiry,
  updateGuestInquiryStatus
};
