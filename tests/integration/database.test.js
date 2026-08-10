const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Database Integration', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database and query categories', async () => {
    const categories = await prisma.category.findMany();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });

  it('should create and retrieve a user', async () => {
    const testEmail = `test-${Date.now()}@boxkart.test`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'dummyhash',
        firstName: 'Integration',
        lastName: 'Test',
        role: 'CUSTOMER'
      }
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);

    const fetchedUser = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser.id).toBe(user.id);
  });
});
