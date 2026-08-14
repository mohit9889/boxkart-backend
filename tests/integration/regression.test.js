const { calculateFit } = require('../../src/modules/box-engine/fit.domain');
const { calculateUnitPrice, calculateSubtotal } = require('../../src/modules/pricing/pricing.domain');

describe('Box Engine & Pricing Regression', () => {
  it('should accurately reject an item slightly larger than the box', () => {
    const boxDimensions = { length: 200, width: 200, height: 200, unit: 'MM' };
    const itemDimensions = { length: 201, width: 199, height: 199, unit: 'MM' };
    
    const result = calculateFit(itemDimensions, boxDimensions);
    expect(result.fits).toBe(false);
  });

  it('should reject exact-fit with default min clearance (practical fit requires space)', () => {
    const boxDimensions = { length: 200, width: 200, height: 200, unit: 'MM' };
    const itemDimensions = { length: 200, width: 200, height: 200, unit: 'MM' };
    
    const result = calculateFit(itemDimensions, boxDimensions);
    expect(result.fits).toBe(false);
  });

  it('should fit exact dimensions when min clearance is set to 0', () => {
    const boxDimensions = { length: 200, width: 200, height: 200, unit: 'MM' };
    const itemDimensions = { length: 200, width: 200, height: 200, unit: 'MM' };
    
    const result = calculateFit(itemDimensions, boxDimensions, 0);
    expect(result.fits).toBe(true);
    expect(result.utilization).toBe(1); // 100%
  });

  it('should apply base tier price', () => {
    const tiers = [{ minimumQuantity: 1, maximumQuantity: 100, unitPriceMinor: 1000 }];
    const unitPrice = calculateUnitPrice(50, tiers);
    expect(unitPrice).toBe(1000);
    expect(calculateSubtotal(unitPrice, 50)).toBe(50000);
  });

  it('should accurately apply quantity discounts based on tiers', () => {
    const tiers = [
      { minimumQuantity: 1, maximumQuantity: 499, unitPriceMinor: 1000 },
      { minimumQuantity: 500, maximumQuantity: null, unitPriceMinor: 800 }
    ];
    
    const unitPrice1 = calculateUnitPrice(200, tiers);
    expect(unitPrice1).toBe(1000);
    expect(calculateSubtotal(unitPrice1, 200)).toBe(200000);

    const unitPrice2 = calculateUnitPrice(600, tiers);
    expect(unitPrice2).toBe(800);
    expect(calculateSubtotal(unitPrice2, 600)).toBe(480000);
  });
});
