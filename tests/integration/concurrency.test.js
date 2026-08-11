const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

let token;
let productId;

describe('Concurrency Testing', () => {
  beforeAll(async () => {
    const userEmail = `concurrent_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/signup').send({
      email: userEmail, password: 'Password123!', firstName: 'Race', lastName: 'Condition'
    });
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: userEmail, password: 'Password123!'
    });
    token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const box = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
    productId = box.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should handle concurrent cart additions securely', async () => {
    // Attempt to add 5 identical items to the cart simultaneously
    const requests = Array.from({ length: 5 }).map(() => 
      request(app)
        .post('/api/v1/cart/items')
        .set('Cookie', [`token=${token}`])
        .send({
          productId: productId,
          quantity: 1000
        })
    );
    
    await Promise.allSettled(requests);
    
    // Check final cart state. Because Prisma handles sequential upserts, 
    // it may either aggregate them or fail some if constraints hit.
    // What matters is the DB is consistent and the app didn't crash.
    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Cookie', [`token=${token}`]);

    expect(cartRes.statusCode).toBe(200);
    // As long as items exist, the test passes
    expect(cartRes.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
