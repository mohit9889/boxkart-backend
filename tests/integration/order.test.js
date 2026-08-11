const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

let token;
let validProductId;

describe('Order API', () => {
  beforeAll(async () => {
    const uniqueEmail = `orderuser_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
        firstName: 'Order',
        lastName: 'User'
      });
      
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: uniqueEmail,
        password: 'Password123!'
      });

    if (!loginRes.headers['set-cookie']) {
      throw new Error('Login failed');
    }
    
    token = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    const box = await prisma.product.findFirst({
      where: { sku: 'BOX-M-01' }
    });
    
    await prisma.product.update({
      where: { id: box.id },
      data: { status: 'ACTIVE' }
    });
    
    validProductId = box.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return 400 when creating order from empty cart', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Cart is empty');
  });

  let orderId;

  it('should create an order successfully and empty the cart', async () => {
    await request(app)
      .post('/api/v1/cart/items')
      .set('Cookie', [`token=${token}`])
      .send({
        productId: validProductId,
        quantity: 500
      });

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.payments.length).toBe(1);
    
    orderId = res.body.data.id;

    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Cookie', [`token=${token}`]);

    if (cartRes.statusCode !== 200) {
      console.log('Cart fetch failed:', cartRes.body);
    }
    expect(cartRes.statusCode).toBe(200);
    expect(cartRes.body.data.items.length).toBe(0);
  });

  it('should retrieve list of orders', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Cookie', [`token=${token}`]);

    if (res.statusCode !== 200) {
      console.log('Get orders failed:', res.body);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(orderId);
  });

  it('should retrieve order details by ID', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Cookie', [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].productId).toBe(validProductId);
  });

  it('should update order status legally', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Cookie', [`token=${token}`])
      .send({ status: 'CONFIRMED' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('should reject illegal status updates', async () => {
    const res = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Cookie', [`token=${token}`])
      .send({ status: 'DELIVERED' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error.message).toMatch(/Illegal state transition/);
  });
});
