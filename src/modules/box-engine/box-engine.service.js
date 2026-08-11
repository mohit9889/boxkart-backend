const prisma = require('../../infrastructure/database/prismaClient');
const {
  calculateFit,
  calculateScore,
  normalizeWeightToKG
} = require('./fit.domain');
const AppError = require('../../utils/AppError');
const { selectApplicablePriceTier } = require('../pricing/pricing.domain');

const recommendBoxes = async (input) => {
  const { product: inputProduct, requirements } = input;

  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      boxSpecification: { isNot: null }
    },
    include: {
      boxSpecification: true,
      priceTiers: true
    }
  });

  const recommendations = [];
  const normalizedInputWeight = normalizeWeightToKG(
    inputProduct.weight,
    inputProduct.weightUnit
  );

  for (const candidate of candidates) {
    const spec = candidate.boxSpecification;

    if (normalizedInputWeight && spec.maxRecommendedWeight) {
      const boxMaxWeightKG = normalizeWeightToKG(spec.maxRecommendedWeight, spec.weightUnit);
      if (normalizedInputWeight > boxMaxWeightKG) {
        continue;
      }
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
        const applicableTier = selectApplicablePriceTier(requirements.quantity, candidate.priceTiers);
        if (applicableTier) {
          basePrice = applicableTier.unitPriceMinor;
          currency = applicableTier.currency;
        }
      }

      const scoreData = calculateScore(fitResult, basePrice);

      recommendations.push({
        product: {
          id: candidate.id,
          name: candidate.name,
          slug: candidate.slug,
          sku: candidate.sku
        },
        fit: fitResult.fits,
        orientation: fitResult.orientation,
        clearance: fitResult.clearance,
        utilization: Math.round(fitResult.utilization * 1000) / 1000,
        score: scoreData.total,
        scoreBreakdown: scoreData.breakdown,
        pricing: {
          unitPriceMinor: basePrice,
          currency: currency
        }
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);

  if (recommendations.length === 0) {
    throw new AppError('No suitable box found', {
      code: 'NO_FIT_FOUND',
      statusCode: 404
    });
  }

  return recommendations;
};

module.exports = {
  recommendBoxes
};
