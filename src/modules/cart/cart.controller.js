const { itemSchema, updateItemSchema } = require('./cart.validation');
const cartService = require('./cart.service');

const getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    console.error('getCart error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const addItem = async (req, res) => {
  try {
    const { productId, quantity } = itemSchema.parse(req.body);
    const cart = await cartService.addItem(req.user.id, productId, quantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    if (error.message.includes('Minimum order quantity')) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('addItem error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = updateItemSchema.parse(req.body);
    const cart = await cartService.updateItem(req.user.id, itemId, quantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: 'Validation failed', details: error.errors }
        });
    }
    if (
      error.message === 'Item not found in your cart' ||
      error.message.includes('Minimum order quantity')
    ) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('updateItem error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await cartService.removeItem(req.user.id, itemId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    if (error.message === 'Item not found in your cart') {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('removeItem error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    console.error('clearCart error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  validateCart: async (req, res) => {
    try {
      const result = await cartService.validateCart(req.user.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('validateCart error:', error);
      res
        .status(500)
        .json({ success: false, error: { message: 'Internal server error' } });
    }
  }
};
