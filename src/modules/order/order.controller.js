const { updateStatusSchema } = require('./order.validation');
const orderService = require('./order.service');

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user.id);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (
      error.message === 'Cart is empty' ||
      error.message.includes('Minimum order quantity')
    ) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('createOrder error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('getOrders error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(req.user.id, id);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res
        .status(404)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('getOrder error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const order = await orderService.updateOrderStatus(req.user.id, id, status);
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
    if (error.message === 'Order not found') {
      return res
        .status(404)
        .json({ success: false, error: { message: error.message } });
    }
    if (error.message.includes('Illegal state transition')) {
      return res
        .status(400)
        .json({ success: false, error: { message: error.message } });
    }
    console.error('updateOrderStatus error:', error);
    res
      .status(500)
      .json({ success: false, error: { message: 'Internal server error' } });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus
};
