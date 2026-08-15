const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('../modules/auth/auth.routes');
const catalogRoutes = require('../modules/catalog/catalog.routes');
const boxEngineRoutes = require('../modules/box-engine/box-engine.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const pricingRoutes = require('../modules/pricing/pricing.routes');
const checkoutRoutes = require('../modules/checkout/checkout.routes');
const orderRoutes = require('../modules/order/order.routes');
const rfqRoutes = require('../modules/rfq/rfq.routes');
const quoteRoutes = require('../modules/quotes/quotes.routes');
const customPackagingRoutes = require('../modules/custom-packaging/custom-packaging.routes');
const bundlesRoutes = require('../modules/bundles/bundles.routes');
const adminRoutes = require('../modules/admin/admin.routes');

const swaggerDocument = YAML.load(
  path.join(__dirname, '../api-spec/openapi.yaml')
);

router.use('/api/reference', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1', catalogRoutes);
router.use('/api/v1/box-finder', boxEngineRoutes);
router.use('/api/v1/cart', cartRoutes);
router.use('/api/v1/pricing', pricingRoutes);
router.use('/api/v1/checkout', checkoutRoutes);
router.use('/api/v1/orders', orderRoutes);
router.use('/api/v1/rfq', rfqRoutes);
router.use('/api/v1/quotes', quoteRoutes);
router.use('/api/v1/custom-packaging', customPackagingRoutes);
router.use('/api/v1/bundles', bundlesRoutes);
router.use('/api/v1/admin', adminRoutes);

const prisma = require('../infrastructure/database/prismaClient');

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
