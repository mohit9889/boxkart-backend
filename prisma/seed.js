const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // Users
  await prisma.user.upsert({
    where: { email: 'admin@boxkart.test' },
    update: {},
    create: {
      email: 'admin@boxkart.test',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'customer@boxkart.test' },
    update: {},
    create: {
      email: 'customer@boxkart.test',
      passwordHash: customerPassword,
      firstName: 'Test',
      lastName: 'Customer',
      role: 'CUSTOMER'
    }
  });

  // Categories
  const catBoxes = await prisma.category.upsert({
    where: { slug: 'corrugated-boxes' },
    update: {},
    create: { name: 'Corrugated Boxes', slug: 'corrugated-boxes' }
  });

  const catMailers = await prisma.category.upsert({
    where: { slug: 'mailers' },
    update: {},
    create: { name: 'Mailers', slug: 'mailers' }
  });

  // Example Product
  const product = await prisma.product.upsert({
    where: { sku: 'BOX-M-01' },
    update: {},
    create: {
      sku: 'BOX-M-01',
      slug: 'medium-mailing-box',
      name: 'Medium Mailing Box',
      description: 'Standard medium mailing box',
      categoryId: catBoxes.id,
      productType: 'CORRUGATED_BOX',
      weight: 100,
      weightUnit: 'GRAM'
    }
  });

  // Example Box Specification
  await prisma.boxSpecification.upsert({
    where: { productId: product.id },
    update: {},
    create: {
      productId: product.id,
      internalLength: 200,
      internalWidth: 150,
      internalHeight: 100,
      externalLength: 210,
      externalWidth: 160,
      externalHeight: 110,
      dimensionUnit: 'MM',
      maxRecommendedWeight: 5,
      weightUnit: 'KG',
      flute: 'B_FLUTE',
      ply: 3,
      material: 'Kraft Paper'
    }
  });

  // Price Tiers
  await prisma.productPriceTier.createMany({
    skipDuplicates: true,
    data: [
      { productId: product.id, minimumQuantity: 100, unitPriceMinor: 1550 },
      { productId: product.id, minimumQuantity: 500, unitPriceMinor: 1400 },
      { productId: product.id, minimumQuantity: 1000, unitPriceMinor: 1250 }
    ]
  });

  console.log('✅ Seed data inserted successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
