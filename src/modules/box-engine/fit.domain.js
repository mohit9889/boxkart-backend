/**
 * Pure domain logic for Box Engine.
 * Must NOT depend on Express, Prisma, or HTTP context.
 */

const normalizeToMM = (val, unit) => {
  const value = Number(val);
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid dimension value: ${val}`);
  }
  const upperUnit = unit.toUpperCase();
  switch (upperUnit) {
    case 'INCH':
      return value * 25.4;
    case 'CM':
      return value * 10;
    case 'MM':
      return value;
    default:
      throw new Error(`Unsupported unit: ${unit}`);
  }
};

const normalizeWeightToKG = (val, unit) => {
  if (val === undefined || val === null) return undefined;
  const value = Number(val);
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`Invalid weight value: ${val}`);
  }
  const upperUnit = unit.toUpperCase();
  switch (upperUnit) {
    case 'LB':
      return value * 0.453592;
    case 'GRAM':
      return value / 1000;
    case 'KG':
      return value;
    case 'OZ':
      return value * 0.0283495;
    default:
      throw new Error(`Unsupported weight unit: ${unit}`);
  }
};

const getPermutations = (l, w, h) => {
  return [
    { l, w, h },
    { l, h: w, w: h },
    { l: w, w: l, h },
    { l: w, h: l, w: h },
    { l: h, w: l, h: w },
    { l: h, w, h: l }
  ];
};

const calculateFit = (product, box) => {
  const pL = normalizeToMM(product.length, product.unit);
  const pW = normalizeToMM(product.width, product.unit);
  const pH = normalizeToMM(product.height, product.unit);

  const bL = normalizeToMM(box.length, box.unit);
  const bW = normalizeToMM(box.width, box.unit);
  const bH = normalizeToMM(box.height, box.unit);

  const productVolume = pL * pW * pH;
  const boxVolume = bL * bW * bH;

  const permutations = getPermutations(pL, pW, pH);

  let bestFit = null;

  for (const perm of permutations) {
    if (perm.l <= bL && perm.w <= bW && perm.h <= bH) {
      const clearanceL = bL - perm.l;
      const clearanceW = bW - perm.w;
      const clearanceH = bH - perm.h;

      const totalClearance = clearanceL + clearanceW + clearanceH;

      if (!bestFit || totalClearance < bestFit.totalClearance) {
        bestFit = {
          fits: true,
          orientation: { l: perm.l, w: perm.w, h: perm.h },
          clearance: { l: clearanceL, w: clearanceW, h: clearanceH },
          totalClearance,
          utilization: productVolume / boxVolume
        };
      }
    }
  }

  if (!bestFit) {
    return { fits: false };
  }

  return bestFit;
};

const calculateScore = (
  fitResult,
  basePrice,
  weights = {
    fit: 0.4,
    space: 0.25,
    protection: 0.2,
    price: 0.1,
    availability: 0.05
  }
) => {
  if (!fitResult.fits) return 0;

  // Space efficiency score (0-100) based on volume utilization
  const spaceScore = fitResult.utilization * 100;

  // Fit score (0-100). Tighter fit (less total clearance) is better.
  const maxClearance = 500;
  let fitScore =
    ((maxClearance - fitResult.totalClearance) / maxClearance) * 100;
  if (fitScore < 0) fitScore = 0;

  // Price score (0-100). Lower price is better.
  const maxPrice = 5000;
  let priceScore = ((maxPrice - (basePrice || maxPrice)) / maxPrice) * 100;
  if (priceScore < 0) priceScore = 0;

  // Mocking protection and availability since we don't have real data yet.
  const protectionScore = 80;
  const availabilityScore = 100;

  const finalScore =
    fitScore * weights.fit +
    spaceScore * weights.space +
    protectionScore * weights.protection +
    priceScore * weights.price +
    availabilityScore * weights.availability;

  return {
    total: Math.round(finalScore * 10) / 10,
    breakdown: {
      fit: Math.round(fitScore * 10) / 10,
      space: Math.round(spaceScore * 10) / 10,
      price: Math.round(priceScore * 10) / 10,
      protection: protectionScore,
      availability: availabilityScore
    }
  };
};

module.exports = {
  normalizeToMM,
  normalizeWeightToKG,
  calculateFit,
  calculateScore
};
