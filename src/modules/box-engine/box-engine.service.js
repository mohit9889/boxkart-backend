const prisma = require('../../infrastructure/database/prismaClient');
const {
  calculateFit,
  calculateScore,
  normalizeWeightToKG
} = require('./fit.domain');
const AppError = require('../../utils/AppError');
const { selectApplicablePriceTier } = require('../pricing/pricing.domain');

/**
 * Recommend boxes for a product based on dimensions, weight, and preferences.
 * Evaluates all active boxes, scores them, and returns sorted recommendations.
 */
const recommendBoxes = async (input) => {
  const { product: inputProduct, requirements = {}, preferences = {} } = input;
  const limit = input.limit || 10;
  const priority = preferences.priority || 'BALANCED';

  // Load candidate boxes with specs, pricing, inventory, and images
  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      boxSpecification: { isNot: null }
    },
    include: {
      boxSpecification: true,
      priceTiers: true,
      inventory: true,
      images: { where: { isPrimary: true }, take: 1 }
    }
  });

  const recommendations = [];
  const normalizedInputWeight = inputProduct.weight
    ? normalizeWeightToKG(
        inputProduct.weight,
        inputProduct.weightUnit || 'GRAM'
      )
    : 0;

  // Collect prices for dynamic max calculation
  const allPrices = [];

  for (const candidate of candidates) {
    const spec = candidate.boxSpecification;

    // Weight limit check
    if (normalizedInputWeight && spec.maxRecommendedWeight) {
      const boxMaxWeightKG = normalizeWeightToKG(
        spec.maxRecommendedWeight,
        spec.weightUnit
      );
      if (normalizedInputWeight > boxMaxWeightKG) {
        continue;
      }
    }

    // Fragile preference: if fragile, prefer 5-ply (skip 3-ply when 5-ply is available)
    // This is a soft filter — applied in scoring, not hard exclusion

    // Printing requirement: hard filter
    if (requirements.printingRequired && !spec.printingSupported) {
      continue;
    }

    const boxDims = {
      length: spec.internalLength,
      width: spec.internalWidth,
      height: spec.internalHeight,
      unit: spec.dimensionUnit
    };

    const fitResult = calculateFit(inputProduct, boxDims);

    if (fitResult.fits) {
      let basePrice = null;
      let currency = 'INR';

      if (candidate.priceTiers && candidate.priceTiers.length > 0) {
        const quantity = requirements.quantity || 1;
        const applicableTier = selectApplicablePriceTier(
          quantity,
          candidate.priceTiers
        );
        if (applicableTier) {
          basePrice = applicableTier.unitPriceMinor;
          currency = applicableTier.currency;
        }
      }

      if (basePrice !== null) {
        allPrices.push(basePrice);
      }

      recommendations.push({
        candidate,
        spec,
        fitResult,
        basePrice,
        currency
      });
    }
  }

  // Compute max price for dynamic normalization
  const maxPriceInPool = allPrices.length > 0 ? Math.max(...allPrices) : null;

  // Score and format recommendations
  const scored = recommendations.map(
    ({ candidate, spec, fitResult, basePrice, currency }) => {
      const inv = candidate.inventory;

      const scoreData = calculateScore(
        fitResult,
        basePrice,
        priority,
        {
          ply: spec.ply,
          material: spec.material,
          flute: spec.flute,
          inventoryAvailable: inv?.availableQuantity || 0,
          inventoryStatus: inv?.status || 'OUT_OF_STOCK'
        },
        maxPriceInPool
      );

      // Fragile bonus/penalty: boost score for higher-ply boxes when fragile
      let adjustedScore = scoreData.total;
      if (requirements.fragile && spec.ply) {
        if (spec.ply >= 5) adjustedScore += 5;
        else if (spec.ply <= 3) adjustedScore -= 3;
      }

      const primaryImage = candidate.images?.[0];

      return {
        product: {
          id: candidate.id,
          name: candidate.name,
          slug: candidate.slug,
          sku: candidate.sku,
          dimensions: candidate.dimensions,
          color: candidate.color,
          material: spec.material,
          ply: spec.ply,
          image: primaryImage?.url || null
        },
        fit: fitResult.fits,
        orientation: fitResult.orientation,
        clearance: fitResult.clearance,
        utilization: Math.round(fitResult.utilization * 1000) / 1000,
        score: Math.round(adjustedScore * 10) / 10,
        scoreBreakdown: scoreData.breakdown,
        pricing: {
          unitPriceMinor: basePrice,
          currency
        },
        inventory: {
          status: inv?.status || 'UNKNOWN',
          available: inv?.availableQuantity || 0
        }
      };
    }
  );

  scored.sort((a, b) => b.score - a.score);

  // Limit results
  const limited = scored.slice(0, limit);

  if (limited.length === 0) {
    throw new AppError('No suitable box found for the given dimensions', {
      code: 'NO_FIT_FOUND',
      statusCode: 404
    });
  }

  return limited;
};

module.exports = {
  recommendBoxes
};
