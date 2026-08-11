const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

let token;
let validProductId;

describe('Cart & Pricing API', () => {
  beforeAll(async () => {
    const uniqueEmail = `cartuser_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
        firstName: 'Cart',
        lastName: 'User'
      });
      
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueEmail,
        password: 'Password123!'
      });

    if (!loginRes.headers['set-cookie']) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }
    
    token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const box = await prisma.product.findFirst({
      where: { sku: 'BOX-M-01' }
    });
    
    // Ensure product is ACTIVE for cart tests
    await prisma.product.update({
      where: { id: box.id },
      data: { status: 'ACTIVE' }
    });
    
    validProductId = box.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fetch an empty cart initially', async () => {
    const res = await request(app)
      .get('/api/v1/cart')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.summary.subtotalMinor).toBe(0);
  });

  it('should reject item below MOQ', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Cookie', [`token=${token}`])
      .send({
        productId: validProductId,
        quantity: 1 
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/Minimum order quantity/);
  });

  it('should add item with valid quantity', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Cookie', [`token=${token}`])
      .send({
        productId: validProductId,
        quantity: 500
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].pricing.subtotalMinor).toBeGreaterThan(0);
  });

  it('should update item quantity', async () => {
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Cookie', [`token=${token}`]);
    const itemId = cartRes.body.data.items[0].id;

    const res = await request(app)
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('Cookie', [`token=${token}`])
      .send({
        quantity: 1000
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].quantity).toBe(1000);
  });

  it('should calculate stateless checkout preview', async () => {
    const res = await request(app)
      .post('/api/v1/checkout/preview')
      .send({
        items: [
          { productId: validProductId, quantity: 1000 }
        ]
      });

    if (res.statusCode !== 200) {
      console.log('Checkout Preview failed:', res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.summary.subtotalMinor).toBeGreaterThan(0);
  });
});
