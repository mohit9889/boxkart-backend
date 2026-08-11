const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/infrastructure/database/prismaClient');

describe('Catalog API', () => {
  let categorySlug;
  let productSlug;

  beforeAll(async () => {
    const cat = await prisma.category.findFirst({ where: { status: 'ACTIVE' } });
    if (cat) categorySlug = cat.slug;

    const prod = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
    if (prod) productSlug = prod.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fetch all categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('slug');
    }
  });

  it('should fetch a category by slug', async () => {
    if (!categorySlug) return;
    const res = await request(app).get(`/api/v1/categories/${categorySlug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(categorySlug);
  });

  it('should return 404 for invalid category', async () => {
    const res = await request(app).get('/api/v1/categories/invalid-category-123');
    expect(res.statusCode).toBe(404);
  });

  it('should fetch products with pagination', async () => {
    const res = await request(app).get('/api/v1/products?page=1&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
  });

  it('should filter products by category', async () => {
    if (!categorySlug) return;
    const res = await request(app).get(`/api/v1/products?category=${categorySlug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    res.body.data.forEach(product => {
      expect(product.category.slug).toBe(categorySlug);
    });
  });

  it('should fetch a single product by slug with relations', async () => {
    if (!productSlug) return;
    const res = await request(app).get(`/api/v1/products/${productSlug}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(productSlug);
    expect(res.body.data).toHaveProperty('category');
    expect(res.body.data).toHaveProperty('images');
    expect(res.body.data).toHaveProperty('priceTiers');
  });

  it('should return 404 for invalid product', async () => {
    const res = await request(app).get('/api/v1/products/invalid-product-123');
    expect(res.statusCode).toBe(404);
  });
});
