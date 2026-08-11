const { selectApplicablePriceTier, calculateUnitPrice, calculateSubtotal } = require('../../src/modules/pricing/pricing.domain');

describe('Pricing Domain Logic', () => {
  const mockTiers = [
    { id: 1, minimumQuantity: 100, maximumQuantity: 499, unitPriceMinor: 1400, currency: 'INR' },
    { id: 2, minimumQuantity: 500, maximumQuantity: 999, unitPriceMinor: 1250, currency: 'INR' },
    { id: 3, minimumQuantity: 1000, maximumQuantity: null, unitPriceMinor: 1180, currency: 'INR' },
  ];

  const singleTier = [
    { id: 1, minimumQuantity: 50, maximumQuantity: null, unitPriceMinor: 2000, currency: 'USD' }
  ];

  describe('selectApplicablePriceTier', () => {
    it('should throw if quantity is not an integer', () => {
      expect(() => selectApplicablePriceTier(100.5, mockTiers)).toThrow('Quantity must be a positive integer');
      expect(() => selectApplicablePriceTier('100', mockTiers)).toThrow();
    });

    it('should throw if quantity is zero or negative', () => {
      expect(() => selectApplicablePriceTier(0, mockTiers)).toThrow();
      expect(() => selectApplicablePriceTier(-50, mockTiers)).toThrow();
    });

    it('should throw if no price tiers are provided', () => {
      expect(() => selectApplicablePriceTier(100, null)).toThrow('No price tiers available');
      expect(() => selectApplicablePriceTier(100, [])).toThrow('No price tiers available');
      expect(() => selectApplicablePriceTier(100, undefined)).toThrow();
    });

    it('should return null if quantity is below MOQ (minimum of lowest tier)', () => {
      expect(selectApplicablePriceTier(99, mockTiers)).toBeNull();
      expect(selectApplicablePriceTier(1, mockTiers)).toBeNull();
    });

    it('should select correct tier at exact minimum boundary', () => {
      expect(selectApplicablePriceTier(100, mockTiers).id).toBe(1);
      expect(selectApplicablePriceTier(500, mockTiers).id).toBe(2);
      expect(selectApplicablePriceTier(1000, mockTiers).id).toBe(3);
    });

    it('should select correct tier at exact maximum boundary', () => {
      expect(selectApplicablePriceTier(499, mockTiers).id).toBe(1);
      expect(selectApplicablePriceTier(999, mockTiers).id).toBe(2);
    });

    it('should handle open-ended maximum tier correctly', () => {
      expect(selectApplicablePriceTier(5000, mockTiers).id).toBe(3);
      expect(selectApplicablePriceTier(1000000, mockTiers).id).toBe(3);
    });

    it('should handle a single tier configuration', () => {
      expect(selectApplicablePriceTier(49, singleTier)).toBeNull();
      expect(selectApplicablePriceTier(50, singleTier).id).toBe(1);
      expect(selectApplicablePriceTier(1000, singleTier).id).toBe(1);
    });
  });

  describe('calculateUnitPrice', () => {
    it('should find the correct tier unit price for a valid quantity', () => {
      expect(calculateUnitPrice(150, mockTiers)).toBe(1400);
      expect(calculateUnitPrice(500, mockTiers)).toBe(1250);
      expect(calculateUnitPrice(5000, mockTiers)).toBe(1180);
    });

    it('should throw INVALID_QUANTITY if below minimum tier', () => {
      expect(() => calculateUnitPrice(50, mockTiers)).toThrow('INVALID_QUANTITY');
    });

    it('should return correct price even if tiers are not pre-sorted', () => {
      const unsortedTiers = [
        mockTiers[2],
        mockTiers[0],
        mockTiers[1]
      ];
      expect(calculateUnitPrice(150, unsortedTiers)).toBe(1400);
      expect(calculateUnitPrice(550, unsortedTiers)).toBe(1250);
    });
  });

  describe('calculateSubtotal', () => {
    it('should compute strictly with integers', () => {
      expect(calculateSubtotal(1250, 500)).toBe(625000);
      expect(calculateSubtotal(100, 1)).toBe(100);
      expect(calculateSubtotal(0, 500)).toBe(0);
    });

    it('should throw if unitPriceMinor is a float', () => {
      expect(() => calculateSubtotal(12.50, 500)).toThrow('Pricing calculations must use integers');
    });

    it('should throw if quantity is a float', () => {
      expect(() => calculateSubtotal(1250, 500.5)).toThrow('Pricing calculations must use integers');
    });

    it('should handle large integers correctly safely without precision loss', () => {
      // 10 million quantity at 20,000 minor units
      const result = calculateSubtotal(20000, 10000000);
      expect(result).toBe(200000000000);
    });
  });
});
