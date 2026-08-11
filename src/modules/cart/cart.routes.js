const express = require('express');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
} = require('./cart.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/items', addItem);
router.patch('/items/:itemId', updateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);
router.post(
  '/validate',
  requireAuth,
  require('./cart.controller').validateCart
);

module.exports = router;
