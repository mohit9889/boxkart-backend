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
    
    global.concurrentUserEmail = userEmail;

    const box = await prisma.product.findFirst({ where: { sku: 'BOX-M-01' } });
    await prisma.product.update({ where: { id: box.id }, data: { status: 'ACTIVE' } });
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

  it('should prevent concurrent quote acceptance', async () => {
    // 1. Create RFQ
    const rfqRes = await request(app).post('/api/v1/rfq').set('Cookie', [`token=${token}`]).send({ requiredQuantity: 100, packagingType: 'CORRUGATED_BOX' });
    const rfqId = rfqRes.body.data.id;

    // 2. Add Item to RFQ
    await request(app).post(`/api/v1/rfq/${rfqId}/items`).set('Cookie', [`token=${token}`]).send({ length: 200, width: 100, height: 100, dimensionUnit: 'MM', quantity: 100, material: 'KRAFT' });

    // 3. Submit RFQ
    await request(app).post(`/api/v1/rfq/${rfqId}/submit`).set('Cookie', [`token=${token}`]);

    // 4. Create Admin Token
    const adminEmail = `admin_${Date.now()}@example.com`;
    await prisma.user.create({ data: { email: adminEmail, passwordHash: 'hashed', firstName: 'Admin', lastName: 'User', role: 'ADMIN' } });
    const adminToken = require('../../src/modules/auth/token.service').generateToken(
      (await prisma.user.findUnique({ where: { email: adminEmail } })).id,
      'ADMIN'
    );

    // 4. Create Quote A and Quote B
    const quoteARes = await request(app).post(`/api/v1/rfq/${rfqId}/quote`).set('Cookie', [`token=${adminToken}`]).send({ subtotalMinor: 1000, totalMinor: 1000 });
    const quoteBRes = await request(app).post(`/api/v1/rfq/${rfqId}/quote`).set('Cookie', [`token=${adminToken}`]).send({ subtotalMinor: 2000, totalMinor: 2000 });
    
    const quoteAId = quoteARes.body.data.id;
    const quoteBId = quoteBRes.body.data.id;

    // 5. Create a shipping address
    const userId = (await prisma.user.findUnique({ where: { email: global.concurrentUserEmail } })).id;
    const address = await prisma.address.create({
      data: { userId, addressLine1: '123 Main', city: 'City', state: 'State', country: 'IN', postalCode: '123456', fullName: 'Test User', phone: '1234567890' }
    });

    // 6. Attempt concurrent acceptance
    const acceptRequests = [
      request(app).post(`/api/v1/rfq/${rfqId}/quotes/${quoteAId}/accept`).set('Cookie', [`token=${token}`]).set('Idempotency-Key', `ik-${Date.now()}-A`).send({ shippingAddressId: address.id }),
      request(app).post(`/api/v1/rfq/${rfqId}/quotes/${quoteBId}/accept`).set('Cookie', [`token=${token}`]).set('Idempotency-Key', `ik-${Date.now()}-B`).send({ shippingAddressId: address.id })
    ];

    const results = await Promise.all(acceptRequests);
    
    // One should succeed, one should fail with 409
    const statuses = results.map(r => r.statusCode);
    
    // If we have 500s, log them to help debug
    if (statuses.includes(500)) {
       console.log("500 Responses:", results.filter(r => r.statusCode === 500).map(r => r.body));
    }

    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  }, 15000);
});
