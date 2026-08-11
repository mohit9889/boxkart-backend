const adminService = require('./admin.service');
const validation = require('./admin.validation');
const AppError = require('../../utils/AppError');

const createCategory = async (req, res, next) => {
  try {
    const data = validation.createCategorySchema.parse(req.body);
    const category = await adminService.createCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const data = validation.updateCategorySchema.parse(req.body);
    const category = await adminService.updateCategory(req.params.id, data);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = validation.createProductSchema.parse(req.body);
    const product = await adminService.createProduct(data);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const data = validation.updateProductSchema.parse(req.body);
    const product = await adminService.updateProduct(req.params.id, data);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getOrders(page, limit);
    res.status(200).json({ success: true, data: result.orders, meta: result.pagination });
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
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
};

const getRfqs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getRfqs(page, limit);
    res.status(200).json({ success: true, data: result.rfqs, meta: result.pagination });
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
    if (error.name === 'ZodError') {
      return next(new AppError('Validation failed', {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors
      }));
    }
    next(error);
  }
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
