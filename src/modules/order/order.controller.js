const { updateStatusSchema, createOrderSchema } = require('./order.validation');
const orderService = require('./order.service');
const AppError = require('../../utils/AppError');

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddressId, shippingAddress, billingAddressId, billingAddress } = createOrderSchema.parse(req.body);
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return next(new AppError('Idempotency-Key header is required and must be between 16 and 128 characters', {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        statusCode: 400
      }));
    }

    const order = await orderService.createOrder(
      req.user.id,
      shippingAddressId,
      shippingAddress,
      billingAddressId,
      billingAddress,
      idempotencyKey
    );
    res.status(201).json({ success: true, data: order });
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
    const { page = 1, limit = 20 } = req.query;
    const orders = await orderService.getUserOrders(req.user.id, page, limit);
    res.status(200).json({ success: true, ...orders });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(req.user.id, id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    if (req.user.role !== 'ADMIN' && status !== 'CANCELLED') {
      return next(new AppError('Customers can only transition orders to CANCELLED', {
        code: 'FORBIDDEN',
        statusCode: 403
      }));
    }

    const order = await orderService.updateOrderStatus(req.user.id, id, status, req.user.role);
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

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
};
