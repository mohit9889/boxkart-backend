const express = require('express');
const {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug
} = require('./catalog.controller');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/categories/:slug', getCategoryBySlug);

router.get('/products', getProducts);
router.get('/products/:slug', getProductBySlug);

module.exports = router;
