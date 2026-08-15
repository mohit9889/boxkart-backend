const express = require('express');
const router = express.Router();
const { listBundles, getBundleBySlug } = require('./bundles.controller');

/** GET /api/v1/bundles — public, returns all active bundles ordered by sortOrder */
router.get('/', listBundles);

/** GET /api/v1/bundles/:slug — public, single bundle detail */
router.get('/:slug', getBundleBySlug);

module.exports = router;
