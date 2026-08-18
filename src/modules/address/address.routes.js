const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  getAddresses,
  createAddress,
  deleteAddress,
  updateAddress
} = require('./address.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', getAddresses);
router.post('/', createAddress);
router.delete('/:id', deleteAddress);
router.put('/:id', updateAddress);

module.exports = router;
