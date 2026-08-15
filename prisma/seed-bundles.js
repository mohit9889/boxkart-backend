/**
 * Seed script for bundles.
 * Run: node prisma/seed-bundles.js
 * Safe to re-run — upserts on slug.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bundles = [
  {
    slug: 'starter-pack',
    name: 'Starter Pack',
    tagline: 'For 100 shipments',
    description:
      'Everything a new seller needs to start shipping professionally. Perfect for Instagram sellers and home businesses.',
    items: [
      { item: '100 × Medium Shipping Boxes (8×6×4")', qty: 100 },
      { item: '100 × Courier Bags (Small)', qty: 100 },
      { item: 'BOPP Tape (6 rolls)', qty: 6 },
      { item: 'Thermal Shipping Labels (1 roll)', qty: 1 },
    ],
    price: 2499,
    originalPrice: 2950,
    savings: 451,
    badge: 'Best for New Sellers',
    popular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    slug: 'growing-seller-pack',
    name: 'Growing Seller Pack',
    tagline: 'For 500 shipments',
    description:
      'Scaled-up packaging kit for growing businesses. Includes branding extras to elevate your customer experience.',
    items: [
      { item: '500 × Medium Shipping Boxes (8×6×4")', qty: 500 },
      { item: '500 × Courier Bags (Medium)', qty: 500 },
      { item: 'BOPP Tape (12 rolls)', qty: 12 },
      { item: 'Thermal Shipping Labels (2 rolls)', qty: 2 },
      { item: 'Thank You Cards (500)', qty: 500 },
    ],
    price: 9999,
    originalPrice: 12500,
    savings: 2501,
    badge: 'Most Popular',
    popular: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    slug: 'd2c-brand-pack',
    name: 'D2C Brand Pack',
    tagline: 'For 1,000+ shipments',
    description:
      'Custom pricing for established D2C brands. Get dedicated account management and custom packaging options.',
    items: [
      { item: '1,000+ Custom-sized Boxes', qty: 1000 },
      { item: '1,000+ Courier Bags', qty: 1000 },
      { item: 'Custom Printed Tape', qty: 36 },
      { item: 'Brand Logo Stickers', qty: 1000 },
      { item: 'Thank You Cards & Inserts', qty: 1000 },
      { item: 'Dedicated Packaging Expert', qty: 1 },
    ],
    price: null,
    originalPrice: null,
    savings: null,
    badge: 'Enterprise',
    popular: false,
    isActive: true,
    sortOrder: 3,
  },
];

async function main() {
  console.log('Seeding bundles...');
  for (const bundle of bundles) {
    await prisma.bundle.upsert({
      where: { slug: bundle.slug },
      update: bundle,
      create: bundle,
    });
    console.log(`  ✅ ${bundle.name}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
