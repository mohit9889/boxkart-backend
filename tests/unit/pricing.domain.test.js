const { calculateUnitPrice, calculateSubtotal } = require('../../src/modules/pricing/pricing.domain');

describe('Pricing Domain Logic', () => {
  const mockTiers = [
    { minimumQuantity: 100, maximumQuantity: 499, unitPriceMinor: 1400 },
    { minimumQuantity: 500, maximumQuantity: 999, unitPriceMinor: 1250 },
    { minimumQuantity: 1000, maximumQuantity: null, unitPriceMinor: 1180 },
  ];

  describe('calculateUnitPrice', () => {
    it('should find the correct tier for 150', () => {
      expect(calculateUnitPrice(150, mockTiers)).toBe(1400);
    });
    
    it('should find the correct tier for 500', () => {
      expect(calculateUnitPrice(500, mockTiers)).toBe(1250);
    });

    it('should find the unbounded tier for 5000', () => {
      expect(calculateUnitPrice(5000, mockTiers)).toBe(1180);
    });

    it('should throw if quantity is below MOQ', () => {
      expect(() => calculateUnitPrice(50, mockTiers)).toThrow('INVALID_QUANTITY');
    });

    it('should throw if quantity is invalid', () => {
      expect(() => calculateUnitPrice(-10, mockTiers)).toThrow();
      expect(() => calculateUnitPrice(10.5, mockTiers)).toThrow();
      expect(() => calculateUnitPrice('100', mockTiers)).toThrow();
    });
  });

  describe('calculateSubtotal', () => {
    it('should compute strictly with integers', () => {
      expect(calculateSubtotal(1250, 500)).toBe(625000);
    });
    it('should throw if floats are passed', () => {
      expect(() => calculateSubtotal(12.50, 500)).toThrow();
      expect(() => calculateSubtotal(1250, 500.5)).toThrow();
    });
  });
});
