/**
 * Pure domain logic for Pricing Engine.
 * Strict integer arithmetic only.
 */

const selectApplicablePriceTier = (quantity, priceTiers) => {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Quantity must be a positive integer');
  }

  if (!priceTiers || priceTiers.length === 0) {
    throw new Error('No price tiers available');
  }

  const sortedTiers = [...priceTiers].sort(
    (a, b) => b.minimumQuantity - a.minimumQuantity
  );

  for (const tier of sortedTiers) {
    if (quantity >= tier.minimumQuantity) {
      if (!tier.maximumQuantity || quantity <= tier.maximumQuantity) {
        return tier;
      }
    }
  }

  return null;
};

const calculateUnitPrice = (quantity, priceTiers) => {
  const matchingTier = selectApplicablePriceTier(quantity, priceTiers);

  if (!matchingTier) {
    throw new Error('INVALID_QUANTITY');
  }

  return matchingTier.unitPriceMinor;
};

const calculateSubtotal = (unitPriceMinor, quantity) => {
  if (!Number.isInteger(unitPriceMinor) || !Number.isInteger(quantity)) {
    throw new Error('Pricing calculations must use integers');
  }
  return unitPriceMinor * quantity;
};

module.exports = {
  selectApplicablePriceTier,
  calculateUnitPrice,
  calculateSubtotal
};
