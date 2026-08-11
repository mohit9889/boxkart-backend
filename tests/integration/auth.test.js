const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

describe('Authentication API', () => {
  let cookie;
  const testEmail = `auth-${Date.now()}@test.com`;
  const testPassword = 'securePassword123!';

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('should successfully sign up a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: testEmail,
        password: testPassword,
        firstName: 'Auth',
        lastName: 'Test',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.role).toBe('CUSTOMER');
  });

  it('should prevent signing up with an existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Email already in use');
  });

  it('should log in an existing user and return a cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    cookie = setCookie[0];
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
  });

  it('should fetch the current user using the cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('should reject unauthenticated access to /me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('should log out the user and clear cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);

    expect(res.statusCode).toBe(200);
    
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain('token=;');
  });
});
