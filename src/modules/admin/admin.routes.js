const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { requireAdmin } = require('../../middleware/auth');

// Apply admin RBAC to all routes in this router
router.use(requireAdmin);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.patch('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Products
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.patch('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Suppliers
router.get('/suppliers', adminController.getSuppliers);
router.post('/suppliers', adminController.createSupplier);
router.patch('/suppliers/:id', adminController.updateSupplier);

// Orders
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);

// RFQs
router.get('/rfqs', adminController.getRfqs);
router.patch('/rfqs/:id/status', adminController.updateRfqStatus);

// Quotes
router.get('/quotes', adminController.getQuotes);

// Guest Inquiries (from the custom packaging form)
router.get('/guest-inquiries', adminController.getGuestInquiries);
router.get('/guest-inquiries/:id', adminController.getGuestInquiry);
router.patch(
  '/guest-inquiries/:id/status',
  adminController.updateGuestInquiryStatus
);

module.exports = router;
