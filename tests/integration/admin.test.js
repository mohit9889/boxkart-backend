const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

let userToken;
let adminToken;

describe('Admin API', () => {
  beforeAll(async () => {
    // Create regular user
    const userEmail = `user_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/signup').send({
      email: userEmail, password: 'Password123!', firstName: 'User', lastName: 'Test'
    });
    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: userEmail, password: 'Password123!'
    });
    userToken = userLogin.headers['set-cookie'][0].split(';')[0].split('=')[1];

    // Create admin user
    const adminEmail = `admin_${Date.now()}@example.com`;
    await request(app).post('/api/v1/auth/signup').send({
      email: adminEmail, password: 'Password123!', firstName: 'Admin', lastName: 'Test'
    });
    
    // Update role in DB to ADMIN
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });
    
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: adminEmail, password: 'Password123!'
    });
    adminToken = adminLogin.headers['set-cookie'][0].split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should block non-admin users from admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Cookie', [`token=${userToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.message).toContain('Forbidden');
  });

  it('should allow admin users to fetch orders', async () => {
    const res = await request(app)
      .get('/api/v1/admin/orders')
      .set('Cookie', [`token=${adminToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });
  
  it('should allow admin to create a category', async () => {
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Cookie', [`token=${adminToken}`])
      .send({
        name: 'New Custom Category',
        slug: `new-cat-${Date.now()}`
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('New Custom Category');
  });
});
