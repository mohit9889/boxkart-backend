const { normalizeToMM, normalizeWeightToKG, calculateFit, calculateScore } = require('../../src/modules/box-engine/fit.domain');

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
    it('should return 0 for zero value', () => {
      expect(normalizeToMM(0, 'CM')).toBe(0);
    });
    it('should return negative values unchanged in conversion but mathematically correct (though invalid physically)', () => {
      expect(normalizeToMM(-5, 'CM')).toBe(-50);
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
    it('should determine perfect fit without rotation (LWH)', () => {
      const product = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
      expect(result.utilization).toBe(1);
      expect(result.totalClearance).toBe(0);
    });

    it('should find fit using permutations (LHW)', () => {
      const product = { length: 5, width: 3, height: 4, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (WLH)', () => {
      const product = { length: 4, width: 5, height: 3, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (WHL)', () => {
      const product = { length: 4, width: 3, height: 5, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (HLW)', () => {
      const product = { length: 3, width: 5, height: 4, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
      const result = calculateFit(product, box);
      expect(result.fits).toBe(true);
    });

    it('should find fit using permutations (HWL)', () => {
      const product = { length: 3, width: 4, height: 5, unit: 'INCH' };
      const box = { length: 5, width: 4, height: 3, unit: 'INCH' };
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
  });

  describe('Scoring', () => {
    it('should return 0 if it does not fit', () => {
      const result = calculateScore({ fits: false }, 100);
      expect(result).toBe(0);
    });

    it('should calculate valid deterministic score', () => {
      const fitResult = {
        fits: true,
        totalClearance: 50,
        utilization: 0.8
      };
      const score = calculateScore(fitResult, 1000);
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown).toBeDefined();
      expect(score.breakdown.fit).toBe(90);
      expect(score.breakdown.space).toBe(80);
      expect(score.breakdown.price).toBe(80);
    });

    it('should calculate score for high price', () => {
      const fitResult = {
        fits: true,
        totalClearance: 50,
        utilization: 0.8
      };
      const scoreHigh = calculateScore(fitResult, 4500);
      const scoreLow = calculateScore(fitResult, 500);
      expect(scoreHigh.breakdown.price).toBeLessThan(scoreLow.breakdown.price);
    });

    it('should cap price score at 0 if price > maxPrice', () => {
      const fitResult = {
        fits: true,
        totalClearance: 50,
        utilization: 0.8
      };
      const score = calculateScore(fitResult, 6000);
      expect(score.breakdown.price).toBe(0);
    });

    it('should cap space score at 0 if clearance > maxClearance', () => {
      const fitResult = {
        fits: true,
        totalClearance: 600,
        utilization: 0.1
      };
      const score = calculateScore(fitResult, 100);
      expect(score.breakdown.fit).toBe(0);
    });
    
    it('should handle missing price smoothly', () => {
      const fitResult = {
        fits: true,
        totalClearance: 50,
        utilization: 0.8
      };
      const score = calculateScore(fitResult, null);
      expect(score.total).toBeGreaterThan(0);
      expect(score.breakdown.price).toBe(100); 
    });
  });
});
