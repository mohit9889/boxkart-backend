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
    it('should throw on invalid unit', () => {
      expect(() => normalizeToMM(10, 'FOOT')).toThrow();
    });
  });

  describe('Weight Normalization', () => {
    it('should convert LB to KG', () => {
      expect(normalizeWeightToKG(10, 'LB')).toBeCloseTo(4.53592);
    });
  });

  describe('Fit Engine', () => {
    it('should determine perfect fit', () => {
      const product = { length: 5, width: 5, height: 5, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      
      expect(result.fits).toBe(true);
      expect(result.utilization).toBeLessThan(1);
    });

    it('should find fit using permutations (rotation)', () => {
      const product = { length: 1, width: 2, height: 6, unit: 'INCH' };
      const box = { length: 6, width: 2, height: 1, unit: 'INCH' };
      const result = calculateFit(product, box);
      
      expect(result.fits).toBe(true);
      expect(result.totalClearance).toBe(0);
      expect(result.utilization).toBe(1);
    });

    it('should reject when product is too large in all orientations', () => {
      const product = { length: 7, width: 7, height: 7, unit: 'INCH' };
      const box = { length: 6, width: 6, height: 6, unit: 'INCH' };
      const result = calculateFit(product, box);
      
      expect(result.fits).toBe(false);
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
  });
});
