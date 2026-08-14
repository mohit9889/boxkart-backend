const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

let validProductId;

describe('Pricing API Integration Tests', () => {
  beforeAll(async () => {
    // Find a product that has price tiers
    const box = await prisma.product.findFirst({
      where: { sku: 'CB-8x6x4' }
    });
    
    // Ensure product is ACTIVE
    await prisma.product.update({
      where: { id: box.id },
      data: { status: 'ACTIVE' }
    });
    
    validProductId = box.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should calculate price correctly at tier boundary (500)', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({
        productId: validProductId,
        quantity: 500
      });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quantity).toBe(500);
    expect(res.body.data.unitPriceMinor).toBe(950); // From seed: CB-8x6x4 at 500 qty
    expect(res.body.data.subtotalMinor).toBe(475000);
    expect(res.body.data.currency).toBe('INR');
  });

  it('should throw an error if quantity is below MOQ (50)', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({
        productId: validProductId,
        quantity: 50
      });
      
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Minimum order quantity/);
  });

  it('should ignore any frontend price injected into payload', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({
        productId: validProductId,
        quantity: 500,
        unitPriceMinor: 10, // malicious attempt to lower price
        totalMinor: 5000,
        currency: 'USD'
      });
      
    expect(res.statusCode).toBe(200);
    // Verified authoritative database price wins
    expect(res.body.data.unitPriceMinor).toBe(950);
    expect(res.body.data.currency).toBe('INR');
  });

  it('should return 400 for invalid quantities (negative, zero, decimal)', async () => {
    const invalidQuantities = [-10, 0, 10.5, '500'];
    
    for (const q of invalidQuantities) {
      const res = await request(app)
        .post('/api/v1/pricing/calculate')
        .send({
          productId: validProductId,
          quantity: q
        });
        
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    }
  });

  it('should handle open-ended maximum tiers correctly (quantity: 5000)', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({
        productId: validProductId,
        quantity: 5000
      });
      
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unitPriceMinor).toBe(790); // From seed: CB-8x6x4 at 5000 qty
  });
});
