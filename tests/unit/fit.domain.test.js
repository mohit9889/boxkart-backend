const { normalizeToMM, normalizeWeightToKG, calculateFit, calculateScore, DEFAULT_MIN_CLEARANCE_MM } = require('../../src/modules/box-engine/fit.domain');

describe('Box Engine Fit Domain Logic', () => {
  describe('Dimension Normalization', () => {
    it('should convert INCH to MM', () => {
      expect(normalizeToMM(10, 'INCH')).toBeCloseTo(254);
    });
    it('should convert CM to MM', () => {
      expect(normalizeToMM(10, 'CM')).toBe(100);
    });
    it('should convert MM to MM', () => {
      expect(normalizeToMM(10, 'MM')).toBe(10);
    });
    it('should correctly convert decimal INCH', () => {
      expect(normalizeToMM(5.5, 'INCH')).toBeCloseTo(139.7);
    });
    it('should correctly convert decimal CM', () => {
      expect(normalizeToMM(12.34, 'CM')).toBe(123.4);
    });
    it('should handle Prisma Decimal-like values via toString()', () => {
      // Prisma Decimal objects have a toString() method
      const fakeDecimal = { toString: () => '12.5' };
      expect(normalizeToMM(fakeDecimal, 'CM')).toBe(125);
    });
    it('should throw on invalid value', () => {
      expect(() => normalizeToMM('abc', 'CM')).toThrow('Invalid dimension value');
    });
    it('should throw on invalid unit', () => {
      expect(() => normalizeToMM(10, 'FOOT')).toThrow();
    });
    it('should throw when unit is null or undefined', () => {
      expect(() => normalizeToMM(10, null)).toThrow();
      expect(() => normalizeToMM(10, undefined)).toThrow();
    });
  });

  describe('Weight Normalization', () => {
    it('should convert LB to KG', () => {
      expect(normalizeWeightToKG(10, 'LB')).toBeCloseTo(4.53592);
    });
    it('should convert KG to KG', () => {
      expect(normalizeWeightToKG(5, 'KG')).toBe(5);
    });
    it('should convert GRAM to KG', () => {
      expect(normalizeWeightToKG(1500, 'GRAM')).toBe(1.5);
    });
    it('should convert OZ to KG', () => {
      expect(normalizeWeightToKG(16, 'OZ')).toBeCloseTo(0.4536, 3);
    });
    it('should handle decimal LB', () => {
      expect(normalizeWeightToKG(2.20462, 'LB')).toBeCloseTo(1, 3);
    });
    it('should return 0 for missing or undefined weight', () => {
      expect(normalizeWeightToKG(null, 'KG')).toBe(0);
      expect(normalizeWeightToKG(undefined, 'KG')).toBe(0);
      expect(normalizeWeightToKG(0, 'KG')).toBe(0);
    });
    it('should throw on invalid weight unit', () => {
      expect(() => normalizeWeightToKG(10, 'OUNCE')).toThrow();
    });
  });

  describe('Fit Engine', () => {
    // With min clearance of 5mm, exact-fit (product == box) should NOT fit.
    // This is intentional — a real box needs clearance for practical use.
    it('should reject exact-fit (no clearance) with default min clearance', () => {
      const product = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });

    it('should allow exact-fit when min clearance is set to 0', () => {
      const product = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box, 0);
      expect(result.fits).toBe(true);
      expect(result.utilization).toBe(1);
      expect(result.totalClearance).toBe(0);
    });

    it('should fit with sufficient clearance and find best orientation (LHW)', () => {
      const product = { length: 5, width: 3, height: 4, unit: 'INCH' };
      const box = { length: 6, width: 5, height: 4, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (WLH)', () => {
      const product = { length: 4, width: 5, height: 3, unit: 'INCH' };
      const box = { length: 6, width: 5, height: 4, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (WHL)', () => {
      const product = { length: 4, width: 3, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 5, height: 4, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (HLW)', () => {
      const product = { length: 3, width: 5, height: 4, unit: 'INCH' };
      const box = { length: 6, width: 5, height: 4, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (HWL)', () => {
      const product = { length: 3, width: 4, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 5, height: 4, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should reject when product is too large in all orientations', () => {
      const product = { length: 7, width: 7, height: 7, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });

    it('should reject when product fails on exactly 1 dimension (height)', () => {
      const product = { length: 5, width: 5, height: 7, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });
    
    it('should reject when product fails on exactly 1 dimension (width)', () => {
      const product = { length: 5, width: 7, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });
    
    it('should reject when product fails on exactly 1 dimension (length)', () => {
      const product = { length: 7, width: 5, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });

    it('should handle zero or negative dimensions safely (no fit)', () => {
      const product = { length: 0, width: 5, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
      
      const negativeProduct = { length: -5, width: 5, height: 5, unit: 'INCH' };
      const resultNeg = calculateFit(negativeProduct, box);
      expect(resultNeg.fits).toBe(false);
    });

    it('should calculate clearance correctly', () => {
      const product = { length: 2, width: 3, height: 4, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
      
      expect(result.clearance.l).toBeGreaterThan(0);
      expect(result.clearance.w).toBeGreaterThan(0);
      expect(result.clearance.h).toBeGreaterThan(0);
      expect(result.totalClearance).toBeGreaterThan(0);
      expect(result.utilization).toBeLessThan(0.2); 
    });

    it('should process cross-unit matches correctly (CM product in INCH box)', () => {
      const product = { length: 12.7, width: 12.7, height: 12.7, unit: 'CM' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
      expect(result.totalClearance).toBeGreaterThan(0);
    });

    it('should reject when clearance is below minimum per dimension', () => {
      // Product is 5 inches (127mm), box is 5.1 inches (129.54mm)
      // Clearance ~2.54mm < 5mm default → should not fit
      const product = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const box = { length: 5.1, width: 4.1, height: 3.1, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(false);
    });

    it('should accept when clearance meets minimum per dimension', () => {
      // Product is 5 inches (127mm), box is 5.5 inches (139.7mm)
      // Clearance ~12.7mm > 5mm → should fit
      const product = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const box = { length: 5.5, width: 4.5, height: 3.5, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });
  });

  describe('Scoring', () => {
    const makeFitResult = (overrides = {}) => ({
      fits: true,
      totalClearance: 50,
      utilization: 0.8,
      orientation: { l: 127, w: 101.6, h: 76.2 },
      clearance: { l: 20, w: 15, h: 15 },
      ...overrides
    });

    it('should return { total: 0, breakdown: {} } if it does not fit', () => {
      const result = calculateScore({ fits: false }, 100);
      expect(result.total).toBe(0);
      expect(result.breakdown).toEqual({});
    });

    it('should calculate valid deterministic score with BALANCED priority', () => {
      const fitResult = makeFitResult();
      const score = calculateScore(fitResult, 1000, 'BALANCED');
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown).toBeDefined();
      expect(score.breakdown.fit).toBeGreaterThan(0);
      expect(score.breakdown.space).toBe(80);
      expect(score.breakdown.protection).toBeGreaterThan(0);
    });

    it('should calculate score for high price — higher price = lower score', () => {
      const fitResult = makeFitResult();
      const scoreHigh = calculateScore(fitResult, 4500, 'BALANCED', {}, 5000);
      const scoreLow = calculateScore(fitResult, 500, 'BALANCED', {}, 5000);
      expect(scoreHigh.breakdown.price).toBeLessThan(scoreLow.breakdown.price);
    });

    it('should cap price score at 0 if price > maxPriceInPool', () => {
      const fitResult = makeFitResult();
      const score = calculateScore(fitResult, 6000, 'BALANCED', {}, 5000);
      expect(score.breakdown.price).toBe(0);
    });

    it('should handle missing price smoothly', () => {
      const fitResult = makeFitResult();
      const score = calculateScore(fitResult, null);
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown.price).toBe(100); 
    });

    it('should use different weights based on priority', () => {
      const fitResult = makeFitResult();
      const balancedScore = calculateScore(fitResult, 1000, 'BALANCED');
      const priceScore = calculateScore(fitResult, 1000, 'LOWEST_PRICE');
      // The totals will differ because weights are different
      expect(balancedScore.total).not.toBe(priceScore.total);
    });

    it('should increase protection score with higher ply', () => {
      const fitResult = makeFitResult();
      const score3Ply = calculateScore(fitResult, 1000, 'BALANCED', { ply: 3 });
      const score5Ply = calculateScore(fitResult, 1000, 'BALANCED', { ply: 5 });
      expect(score5Ply.breakdown.protection).toBeGreaterThan(score3Ply.breakdown.protection);
    });

    it('should set availability score based on inventory status', () => {
      const fitResult = makeFitResult();
      const available = calculateScore(fitResult, 1000, 'BALANCED', {
        inventoryStatus: 'AVAILABLE',
        inventoryAvailable: 100
      });
      const outOfStock = calculateScore(fitResult, 1000, 'BALANCED', {
        inventoryStatus: 'OUT_OF_STOCK',
        inventoryAvailable: 0
      });
      expect(available.breakdown.availability).toBe(100);
      expect(outOfStock.breakdown.availability).toBe(0);
    });
  });
});
