const prisma = require('../../infrastructure/database/prismaClient');
const {
  calculateFit,
  calculateScore,
  normalizeWeightToKG
} = require('./fit.domain');

const recommendBoxes = async (input) => {
  const { product: inputProduct, requirements } = input;

  const candidates = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      boxSpecification: { isNot: null }
    },
    include: {
      boxSpecification: true,
      priceTiers: {
        where: { minimumQuantity: { lte: requirements.quantity } },
        orderBy: { minimumQuantity: 'desc' },
        take: 1
      }
    }
  });

  const recommendations = [];
  const normalizedInputWeight = normalizeWeightToKG(
    inputProduct.weight,
    inputProduct.weightUnit
  );

  for (const candidate of candidates) {
    const spec = candidate.boxSpecification;

    if (normalizedInputWeight && spec.maxWeightCapacity) {
      if (normalizedInputWeight > spec.maxWeightCapacity) {
        continue;
      }
    }

    const boxDims = {
      length: spec.internalLength,
      width: spec.internalWidth,
      height: spec.internalHeight,
      unit: 'MM'
    };

    const fitResult = calculateFit(inputProduct, boxDims);

    if (fitResult.fits) {
      let basePrice = null;
      if (candidate.priceTiers && candidate.priceTiers.length > 0) {
        basePrice = candidate.priceTiers[0].unitPriceMinor;
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
          currency: 'USD'
        }
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
};

module.exports = {
  recommendBoxes
};
