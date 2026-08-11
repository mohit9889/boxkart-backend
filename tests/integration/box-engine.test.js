const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

describe('Box Engine API', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should recommend a box for a given product', async () => {
    const res = await request(app)
      .post('/api/v1/box-finder/recommend')
      .send({
        product: {
          length: 5,
          width: 5,
          height: 3,
          unit: 'INCH',
          weight: 0.5,
          weightUnit: 'KG'
        },
        requirements: {
          quantity: 100
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    if (res.body.data.length > 0) {
      const topRecommendation = res.body.data[0];
      expect(topRecommendation).toHaveProperty('product');
      expect(topRecommendation).toHaveProperty('fit', true);
      expect(topRecommendation).toHaveProperty('score');
      expect(topRecommendation.pricing.currency).toBe('USD');
    }
  });

  it('should return empty list if product is too large for all active boxes', async () => {
    const res = await request(app)
      .post('/api/v1/box-finder/recommend')
      .send({
        product: {
          length: 500,
          width: 500,
          height: 500,
          unit: 'INCH'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('should validate inputs and return 400 for bad data', async () => {
    const res = await request(app)
      .post('/api/v1/box-finder/recommend')
      .send({
        product: {
          length: -5,
          unit: 'INCH'
        }
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
