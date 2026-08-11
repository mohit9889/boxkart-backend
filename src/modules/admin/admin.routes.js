const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { requireAdmin } = require('../../middleware/auth');

// Apply admin RBAC to all routes in this router
router.use(requireAdmin);

// Categories
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);

// Products
router.post('/products', adminController.createProduct);
router.patch('/products/:id', adminController.updateProduct);

// Orders
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// RFQs
router.get('/rfqs', adminController.getRfqs);
router.patch('/rfqs/:id/status', adminController.updateRfqStatus);

module.exports = router;
