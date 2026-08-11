const { itemSchema, updateItemSchema } = require('./cart.validation');
const cartService = require('./cart.service');
const AppError = require('../../utils/AppError');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = itemSchema.parse(req.body);
    const cart = await cartService.addItem(req.user.id, productId, quantity);
    res.status(200).json({ success: true, data: cart });
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

const updateItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = updateItemSchema.parse(req.body);
    const cart = await cartService.updateItem(req.user.id, itemId, quantity);
    res.status(200).json({ success: true, data: cart });
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

const removeItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await cartService.removeItem(req.user.id, itemId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  validateCart: async (req, res, next) => {
    try {
      const result = await cartService.validateCart(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
