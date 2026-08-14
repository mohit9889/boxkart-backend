/**
 * Pure domain logic for Box Engine.
 * Must NOT depend on Express, Prisma, or HTTP context.
 */

/**
 * Weight profiles per priority strategy.
 * Each set of weights sums to 1.0.
 */
const PRIORITY_WEIGHTS = {
  BALANCED: { fit: 0.4, space: 0.25, protection: 0.2, price: 0.1, availability: 0.05 },
  LOWEST_PRICE: { fit: 0.15, space: 0.15, protection: 0.15, price: 0.5, availability: 0.05 },
  BEST_FIT: { fit: 0.45, space: 0.3, protection: 0.1, price: 0.1, availability: 0.05 },
  BEST_PROTECTION: { fit: 0.2, space: 0.1, protection: 0.45, price: 0.1, availability: 0.15 }
};

/** Default minimum clearance per dimension (mm) to ensure practical fit. */
const DEFAULT_MIN_CLEARANCE_MM = 5;

/**
 * Normalize a dimension value to millimetres.
 * Safely handles Prisma Decimal types via toString().
 */
const normalizeToMM = (val, unit) => {
  const value = parseFloat(val.toString());
  if (isNaN(value)) {
    throw new Error(`Invalid dimension value: ${val}`);
  }
  const upperUnit = unit.toUpperCase();
  switch (upperUnit) {
    case 'INCH': return value * 25.4;
    case 'CM': return value * 10;
    case 'MM': return value;
    default: throw new Error(`Unsupported unit: ${unit}`);
  }
};

/**
 * Normalize a weight value to kilograms.
 * Safely handles Prisma Decimal types via toString().
 */
const normalizeWeightToKG = (val, unit) => {
  if (val === undefined || val === null || val === 0) return 0;
  const value = parseFloat(val.toString());
  if (isNaN(value)) {
    throw new Error(`Invalid weight value: ${val}`);
  }
  const upperUnit = unit.toUpperCase();
  switch (upperUnit) {
    case 'LB': return value * 0.453592;
    case 'GRAM': return value / 1000;
    case 'KG': return value;
    case 'OZ': return value * 0.0283495;
    default: throw new Error(`Unsupported weight unit: ${unit}`);
  }
};

/**
 * Generate all 6 orientation permutations for 3D fitting.
 */
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

/**
 * Calculate if a product fits inside a box, considering all orientations.
 * Enforces minimum clearance per dimension for practical usability.
 *
 * @param {Object} product - { length, width, height, unit }
 * @param {Object} box - { length, width, height, unit }
 * @param {number} [minClearanceMM=5] - minimum clearance per dimension in mm
 * @returns {Object} fit result
 */
const calculateFit = (product, box, minClearanceMM = DEFAULT_MIN_CLEARANCE_MM) => {
  const pL = normalizeToMM(product.length, product.unit);
  const pW = normalizeToMM(product.width, product.unit);
  const pH = normalizeToMM(product.height, product.unit);

  const bL = normalizeToMM(box.length, box.unit);
  const bW = normalizeToMM(box.width, box.unit);
  const bH = normalizeToMM(box.height, box.unit);

  if (pL <= 0 || pW <= 0 || pH <= 0 || bL <= 0 || bW <= 0 || bH <= 0) {
    return { fits: false, reason: 'Zero or negative dimension' };
  }

  const productVolume = pL * pW * pH;
  const boxVolume = bL * bW * bH;

  const permutations = getPermutations(pL, pW, pH);

  let bestFit = null;

  for (const perm of permutations) {
    const clearanceL = bL - perm.l;
    const clearanceW = bW - perm.w;
    const clearanceH = bH - perm.h;

    // Must fit AND have minimum clearance on each dimension
    if (clearanceL >= minClearanceMM && clearanceW >= minClearanceMM && clearanceH >= minClearanceMM) {
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
    return { fits: false, reason: 'No orientation provides sufficient clearance' };
  }

  return bestFit;
};

/**
 * Calculate a protection score based on box specification.
 *
 * @param {Object} spec - BoxSpecification { ply, material, flute }
 * @param {Object} clearance - { l, w, h } clearance in mm
 * @returns {number} 0-100 score
 */
const calculateProtectionScore = (spec, clearance) => {
  let score = 50; // Base

  // Ply contribution (3-ply = ok, 5-ply = great)
  if (spec.ply) {
    if (spec.ply >= 5) score += 25;
    else if (spec.ply >= 3) score += 15;
  }

  // Clearance for cushioning (more clearance = more room for padding)
  const avgClearance = (clearance.l + clearance.w + clearance.h) / 3;
  if (avgClearance >= 30) score += 15; // 30mm+ average cushion
  else if (avgClearance >= 15) score += 10;
  else if (avgClearance >= 8) score += 5;

  // Flute type contribution
  if (spec.flute) {
    const flute = spec.flute.toUpperCase();
    if (flute.includes('BC') || flute.includes('AB')) score += 10; // Double wall
    else if (flute.includes('B') || flute.includes('C')) score += 5;
  }

  return Math.min(score, 100);
};

/**
 * Calculate a composite recommendation score.
 *
 * @param {Object} fitResult - from calculateFit
 * @param {number|null} basePrice - unit price in minor units
 * @param {string} priority - scoring priority strategy
 * @param {Object} [extras] - { ply, material, flute, inventoryAvailable, inventoryStatus }
 * @param {number|null} [maxPriceInPool] - max unit price among candidates (for dynamic normalization)
 * @returns {Object} { total, breakdown }
 */
const calculateScore = (fitResult, basePrice, priority = 'BALANCED', extras = {}, maxPriceInPool = null) => {
  if (!fitResult.fits) return { total: 0, breakdown: {} };

  const weights = PRIORITY_WEIGHTS[priority] || PRIORITY_WEIGHTS.BALANCED;

  // Space efficiency score (0-100) based on volume utilization
  const spaceScore = fitResult.utilization * 100;

  // Fit score (0-100) — derive maxClearance dynamically from product dimensions
  // A box 3x the product's max dimension would be absurdly oversized
  const productMaxDim = Math.max(
    fitResult.orientation.l,
    fitResult.orientation.w,
    fitResult.orientation.h
  );
  const maxClearance = Math.max(productMaxDim * 2, 200); // Dynamic cap, min 200mm
  let fitScore = ((maxClearance - fitResult.totalClearance) / maxClearance) * 100;
  if (fitScore < 0) fitScore = 0;

  // Price score (0-100) — lower price is better, dynamic normalization
  let priceScore = 100;
  if (basePrice !== null && basePrice !== undefined) {
    const cap = maxPriceInPool || 10000; // fallback 10000 paise = ₹100
    priceScore = ((cap - basePrice) / cap) * 100;
    if (priceScore < 0) priceScore = 0;
    if (priceScore > 100) priceScore = 100;
  }

  // Real protection score from box spec
  const protectionScore = calculateProtectionScore(
    { ply: extras.ply, material: extras.material, flute: extras.flute },
    fitResult.clearance || { l: 0, w: 0, h: 0 }
  );

  // Availability score from inventory data
  let availabilityScore = 50; // Default — no inventory data
  if (extras.inventoryStatus === 'AVAILABLE' && extras.inventoryAvailable > 0) {
    availabilityScore = 100;
  } else if (extras.inventoryStatus === 'OUT_OF_STOCK') {
    availabilityScore = 0;
  } else if (extras.inventoryStatus === 'DISCONTINUED') {
    availabilityScore = 0;
  }

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
      protection: Math.round(protectionScore * 10) / 10,
      availability: availabilityScore
    }
  };
};

module.exports = {
  PRIORITY_WEIGHTS,
  DEFAULT_MIN_CLEARANCE_MM,
  normalizeToMM,
  normalizeWeightToKG,
  getPermutations,
  calculateFit,
  calculateProtectionScore,
  calculateScore
};
