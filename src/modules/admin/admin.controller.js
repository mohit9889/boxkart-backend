const adminService = require('./admin.service');
const validation = require('./admin.validation');

const createCategory = async (req, res) => {
  try {
    const data = validation.createCategorySchema.parse(req.body);
    const category = await adminService.createCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.createCategory error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateCategory = async (req, res) => {
  try {
    const data = validation.updateCategorySchema.parse(req.body);
    const category = await adminService.updateCategory(req.params.id, data);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.updateCategory error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const createProduct = async (req, res) => {
  try {
    const data = validation.createProductSchema.parse(req.body);
    const product = await adminService.createProduct(data);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.createProduct error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateProduct = async (req, res) => {
  try {
    const data = validation.updateProductSchema.parse(req.body);
    const product = await adminService.updateProduct(req.params.id, data);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.updateProduct error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getOrders(page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('admin.getOrders error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = validation.updateOrderStatusSchema.parse(req.body);
    const order = await adminService.updateOrderStatus(req.params.id, status);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.updateOrderStatus error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getRfqs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const result = await adminService.getRfqs(page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('admin.getRfqs error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateRfqStatus = async (req, res) => {
  try {
    const { status } = validation.updateRfqStatusSchema.parse(req.body);
    const rfq = await adminService.updateRfqStatus(req.params.id, status);
    res.status(200).json({ success: true, data: rfq });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    console.error('admin.updateRfqStatus error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
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
