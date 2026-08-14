const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

/**
 * Comprehensive seed matching BoxKart FE data.
 * Seeds: 2 users, 3 suppliers, 5 categories, 22 products
 * with BoxSpecifications, PriceTiers, Images, and Inventory.
 *
 * Pricing uses integer minor units (paise):
 *   FE ₹7.50 → BE 750 paise
 */
async function main() {
  console.log('🌱 Seeding BoxKart data...');

  /* ── Users ── */
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

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

  console.log('  ✅ Users');

  /* ── Suppliers ── */
  const supDelhi = await prisma.supplier.upsert({
    where: { id: await findOrCreateSupplierId('Delhi PackCo') },
    update: {},
    create: {
      name: 'Delhi PackCo',
      location: 'Okhla, New Delhi',
      rating: 4.8,
      leadTime: '2–4 days',
      verified: true
    }
  });

  const supNCR = await prisma.supplier.upsert({
    where: { id: await findOrCreateSupplierId('NCR Corrugators') },
    update: {},
    create: {
      name: 'NCR Corrugators',
      location: 'Noida, UP',
      rating: 4.6,
      leadTime: '3–5 days',
      verified: true
    }
  });

  const supGurgaon = await prisma.supplier.upsert({
    where: { id: await findOrCreateSupplierId('Gurgaon Boxes') },
    update: {},
    create: {
      name: 'Gurgaon Boxes',
      location: 'Gurgaon, Haryana',
      rating: 4.9,
      leadTime: '1–3 days',
      verified: true
    }
  });

  console.log('  ✅ Suppliers');

  /* ── Categories ── */
  const categories = {
    'corrugated-boxes': await upsertCategory({
      name: 'Corrugated Boxes',
      slug: 'corrugated-boxes',
      description: 'Shipping boxes, mailer boxes, book boxes, die-cut boxes.',
      longDescription: 'High-quality corrugated cardboard boxes in all sizes. Available in 3-ply and 5-ply for light to heavy shipments.',
      icon: 'Package',
      color: '#b8860b',
      sortOrder: 1
    }),
    'courier-packaging': await upsertCategory({
      name: 'Courier Packaging',
      slug: 'courier-packaging',
      description: 'Courier bags, poly mailers, bubble mailers.',
      longDescription: 'Tamper-proof courier bags and padded mailers for lightweight shipments. Water-resistant and cost-effective.',
      icon: 'Truck',
      color: '#3b82f6',
      sortOrder: 2
    }),
    'protection': await upsertCategory({
      name: 'Protection',
      slug: 'protection',
      description: 'Bubble wrap, foam, paper cushioning.',
      longDescription: 'Cushioning and protective materials to keep products safe during transit. From bubble wrap to eco-friendly alternatives.',
      icon: 'Shield',
      color: '#16a34a',
      sortOrder: 3
    }),
    'sealing': await upsertCategory({
      name: 'Sealing',
      slug: 'sealing',
      description: 'BOPP tape, brown tape, printed tape, labels.',
      longDescription: 'Industrial-grade packing tapes and thermal shipping labels. Everything you need to seal and label your packages.',
      icon: 'Lock',
      color: '#f59e0b',
      sortOrder: 4
    }),
    'branding': await upsertCategory({
      name: 'Branding',
      slug: 'branding',
      description: 'Stickers, inserts, thank-you cards, printed packaging.',
      longDescription: 'Brand-building packaging materials including custom stickers, thank-you cards, and printed tape.',
      icon: 'Palette',
      color: '#8b5cf6',
      sortOrder: 5
    })
  };

  console.log('  ✅ Categories');

  /* ── Products ── */

  // Helper: convert FE price (₹ float) to BE price (paise int)
  const toPaise = (rupees) => Math.round(rupees * 100);

  // ─── CORRUGATED BOXES ───

  await upsertProduct({
    sku: 'CB-6x4x3',
    name: 'Small Shipping Box',
    slug: 'small-shipping-box-6x4x3',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Compact corrugated box ideal for cosmetics, jewellery, and small accessories. Strong 3-ply construction keeps items safe during transit.',
    color: 'Brown Kraft',
    dimensions: '6 × 4 × 3"',
    useCases: ['Cosmetics', 'Jewellery', 'Small Electronics', 'Accessories'],
    notRecommendedFor: ['Items over 2 kg', 'Fragile glass without padding'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supDelhi.id,
    image: '/images/box-small.svg',
    boxSpec: { internalLength: 6, internalWidth: 4, internalHeight: 3, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 2, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 7.5 },
      { qty: 500, price: 6.8 },
      { qty: 1000, price: 6.2 },
      { qty: 5000, price: 5.5 },
      { qty: 10000, price: 5.0 }
    ]
  });

  await upsertProduct({
    sku: 'CB-8x6x4',
    name: 'Medium Shipping Box',
    slug: 'medium-shipping-box-8x6x4',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Versatile medium-sized corrugated box, perfect for clothing, cosmetics, and D2C products. The most popular size for e-commerce sellers.',
    color: 'Brown Kraft',
    dimensions: '8 × 6 × 4"',
    useCases: ['Clothing', 'Cosmetics', 'D2C Products', 'Small Electronics'],
    notRecommendedFor: ['Items over 5 kg', 'Heavy machinery parts'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supNCR.id,
    image: '/images/box-medium.svg',
    boxSpec: { internalLength: 8, internalWidth: 6, internalHeight: 4, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 5, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 10.5 },
      { qty: 500, price: 9.5 },
      { qty: 1000, price: 8.9 },
      { qty: 5000, price: 7.9 },
      { qty: 10000, price: 7.2 }
    ]
  });

  await upsertProduct({
    sku: 'CB-10x8x4',
    name: 'Standard Shipping Box',
    slug: 'standard-shipping-box-10x8x4',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Standard-sized corrugated box suitable for a wide range of products. Great for clothing bundles, books, and small electronics.',
    color: 'Brown Kraft',
    dimensions: '10 × 8 × 4"',
    useCases: ['Clothing', 'Books', 'Electronics', 'Home & Lifestyle'],
    notRecommendedFor: ['Items over 5 kg', 'Liquid products without inner seal'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supGurgaon.id,
    image: '/images/box-standard.svg',
    boxSpec: { internalLength: 10, internalWidth: 8, internalHeight: 4, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 7, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 12.5 },
      { qty: 500, price: 11.2 },
      { qty: 1000, price: 10.5 },
      { qty: 5000, price: 9.5 },
      { qty: 10000, price: 8.8 }
    ]
  });

  await upsertProduct({
    sku: 'CB-12x10x6',
    name: 'Large Shipping Box',
    slug: 'large-shipping-box-12x10x6',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Large corrugated box for bulkier shipments. Ideal for shoes, electronics, and multi-item orders.',
    color: 'Brown Kraft',
    dimensions: '12 × 10 × 6"',
    useCases: ['Shoes', 'Electronics', 'Home & Lifestyle', 'Multiple Items'],
    notRecommendedFor: ['Items over 8 kg', 'Very fragile items without wrap'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supDelhi.id,
    image: '/images/box-large.svg',
    boxSpec: { internalLength: 12, internalWidth: 10, internalHeight: 6, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 10, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 16.5 },
      { qty: 500, price: 15.0 },
      { qty: 1000, price: 14.0 },
      { qty: 5000, price: 12.5 },
      { qty: 10000, price: 11.5 }
    ]
  });

  await upsertProduct({
    sku: 'CB-10x8x2',
    name: 'Book Mailer Box',
    slug: 'book-mailer-box-10x8x2',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Flat corrugated mailer designed for books, notebooks, and flat items. Keeps products protected during shipping.',
    color: 'Brown Kraft',
    dimensions: '10 × 8 × 2"',
    useCases: ['Books', 'Notebooks', 'Flat Items', 'Documents'],
    notRecommendedFor: ['Thick items over 2 inches', 'Heavy items over 3 kg'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supNCR.id,
    image: '/images/box-book.svg',
    boxSpec: { internalLength: 10, internalWidth: 8, internalHeight: 2, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 3, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 9.5 },
      { qty: 500, price: 8.5 },
      { qty: 1000, price: 7.9 },
      { qty: 5000, price: 7.0 },
      { qty: 10000, price: 6.5 }
    ]
  });

  await upsertProduct({
    sku: 'CB-12x10x3',
    name: 'Garment Box',
    slug: 'garment-box-12x10x3',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Designed for folded garments and fashion items. Slim profile reduces shipping costs while keeping clothing wrinkle-free.',
    color: 'Brown Kraft',
    dimensions: '12 × 10 × 3"',
    useCases: ['Clothing', 'Garments', 'Fashion', 'D2C Brands'],
    notRecommendedFor: ['Heavy garments', 'Items over 5 kg'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supGurgaon.id,
    image: '/images/box-garment.svg',
    boxSpec: { internalLength: 12, internalWidth: 10, internalHeight: 3, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 5, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 13.0 },
      { qty: 500, price: 11.8 },
      { qty: 1000, price: 11.0 },
      { qty: 5000, price: 9.8 },
      { qty: 10000, price: 9.0 }
    ]
  });

  await upsertProduct({
    sku: 'CB-14x9x5',
    name: 'Shoe Box',
    slug: 'shoe-box-14x9x5',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Purpose-built for footwear shipping. Extra depth accommodates shoe boxes and provides cushioning room.',
    color: 'Brown Kraft',
    dimensions: '14 × 9 × 5"',
    useCases: ['Shoes', 'Footwear', 'Large Accessories'],
    notRecommendedFor: ['Boots or heavy footwear', 'Items over 5 kg'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    supplierId: supDelhi.id,
    image: '/images/box-shoe.svg',
    boxSpec: { internalLength: 14, internalWidth: 9, internalHeight: 5, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'B Flute', gsm: 150, maxRecommendedWeight: 8, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 15.0 },
      { qty: 500, price: 13.5 },
      { qty: 1000, price: 12.5 },
      { qty: 5000, price: 11.0 },
      { qty: 10000, price: 10.0 }
    ]
  });

  await upsertProduct({
    sku: 'CB-5P-12x10x8',
    name: 'Heavy Duty 5-Ply Box',
    slug: 'heavy-duty-5ply-box-12x10x8',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Heavy-duty 5-ply construction for fragile electronics, glassware, and heavy products. Double-wall protection ensures safe delivery.',
    color: 'Brown Kraft',
    dimensions: '12 × 10 × 8"',
    useCases: ['Electronics', 'Fragile Items', 'Heavy Products', 'Glassware'],
    notRecommendedFor: ['Items over 15 kg', 'Extremely fragile items without cushioning'],
    moq: 100,
    deliveryEstimate: '4–6 business days',
    stockStatus: 'In Stock',
    supplierId: supNCR.id,
    image: '/images/box-heavyduty.svg',
    boxSpec: { internalLength: 12, internalWidth: 10, internalHeight: 8, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 5, flute: 'BC Flute', gsm: 250, maxRecommendedWeight: 20, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 100, price: 24.0 },
      { qty: 500, price: 22.0 },
      { qty: 1000, price: 20.5 },
      { qty: 5000, price: 18.5 },
      { qty: 10000, price: 17.0 }
    ]
  });

  await upsertProduct({
    sku: 'CB-5P-16x12x10',
    name: 'Extra Large 5-Ply Box',
    slug: 'extra-large-5ply-box-16x12x10',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'CORRUGATED_BOX',
    description: 'Our largest 5-ply box for oversized shipments. Perfect for large electronics, small appliances, and bulk item orders.',
    color: 'Brown Kraft',
    dimensions: '16 × 12 × 10"',
    useCases: ['Large Electronics', 'Appliances', 'Bulk Items'],
    notRecommendedFor: ['Items over 20 kg', 'Hazardous materials'],
    moq: 50,
    deliveryEstimate: '4–6 business days',
    stockStatus: 'In Stock',
    supplierId: supGurgaon.id,
    image: '/images/box-xlarge.svg',
    boxSpec: { internalLength: 16, internalWidth: 12, internalHeight: 10, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 5, flute: 'BC Flute', gsm: 250, maxRecommendedWeight: 30, weightUnit: 'KG', printingSupported: false },
    tiers: [
      { qty: 50, price: 35.0 },
      { qty: 100, price: 32.0 },
      { qty: 500, price: 28.5 },
      { qty: 1000, price: 26.0 },
      { qty: 5000, price: 23.5 }
    ]
  });

  await upsertProduct({
    sku: 'CB-DC-8x6x2',
    name: 'Die-Cut Mailer Box',
    slug: 'die-cut-mailer-box-8x6x2',
    categoryId: categories['corrugated-boxes'].id,
    productType: 'MAILER_BOX',
    description: 'Premium die-cut mailer in white, perfect for D2C brands wanting a polished unboxing experience. Great for subscription boxes.',
    color: 'White',
    dimensions: '8 × 6 × 2"',
    useCases: ['D2C Brands', 'Cosmetics', 'Subscription Boxes', 'Gifts'],
    notRecommendedFor: ['Items over 1 kg', 'Thick or bulky products'],
    moq: 100,
    deliveryEstimate: '5–7 business days',
    stockStatus: 'In Stock',
    supplierId: supDelhi.id,
    image: '/images/box-diecut.svg',
    boxSpec: { internalLength: 8, internalWidth: 6, internalHeight: 2, dimensionUnit: 'INCH', material: 'Corrugated Cardboard', ply: 3, flute: 'E Flute', gsm: 150, maxRecommendedWeight: 3, weightUnit: 'KG', printingSupported: true, customizationSupported: true },
    tiers: [
      { qty: 100, price: 14.0 },
      { qty: 500, price: 12.5 },
      { qty: 1000, price: 11.5 },
      { qty: 5000, price: 10.0 },
      { qty: 10000, price: 9.0 }
    ]
  });

  // ─── COURIER PACKAGING ───

  await upsertProduct({
    sku: 'CP-BAG-S',
    name: 'Courier Bag – Small',
    slug: 'courier-bag-small',
    categoryId: categories['courier-packaging'].id,
    productType: 'COURIER_BAG',
    description: 'Tamper-proof courier bag with self-adhesive strip. Lightweight and water-resistant for clothing and accessories.',
    color: 'Grey',
    dimensions: '8 × 10"',
    useCases: ['Clothing', 'Accessories', 'Light Items'],
    moq: 100,
    deliveryEstimate: '2–4 business days',
    stockStatus: 'In Stock',
    image: '/images/courier-bag-s.svg',
    tiers: [
      { qty: 100, price: 3.5 },
      { qty: 500, price: 3.0 },
      { qty: 1000, price: 2.7 },
      { qty: 5000, price: 2.3 },
      { qty: 10000, price: 2.0 }
    ]
  });

  await upsertProduct({
    sku: 'CP-BAG-M',
    name: 'Courier Bag – Medium',
    slug: 'courier-bag-medium',
    categoryId: categories['courier-packaging'].id,
    productType: 'COURIER_BAG',
    description: 'Medium courier bag ideal for fashion and clothing items. Tamper-proof with strong adhesive seal.',
    color: 'Grey',
    dimensions: '10 × 14"',
    useCases: ['Clothing', 'Shoes', 'Fashion', 'Multiple Items'],
    moq: 100,
    deliveryEstimate: '2–4 business days',
    stockStatus: 'In Stock',
    image: '/images/courier-bag-m.svg',
    tiers: [
      { qty: 100, price: 4.5 },
      { qty: 500, price: 4.0 },
      { qty: 1000, price: 3.5 },
      { qty: 5000, price: 3.0 },
      { qty: 10000, price: 2.7 }
    ]
  });

  await upsertProduct({
    sku: 'CP-BUBBLE',
    name: 'Bubble Mailer',
    slug: 'bubble-mailer',
    categoryId: categories['courier-packaging'].id,
    productType: 'BUBBLE_MAILER',
    description: 'Padded bubble mailer combining kraft paper with bubble-wrap lining. Perfect for shipping fragile small items safely.',
    color: 'Brown Kraft',
    dimensions: '8 × 10"',
    useCases: ['Electronics', 'Cosmetics', 'Fragile Items', 'Jewellery'],
    moq: 100,
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    image: '/images/bubble-mailer.svg',
    tiers: [
      { qty: 100, price: 8.0 },
      { qty: 500, price: 7.2 },
      { qty: 1000, price: 6.5 },
      { qty: 5000, price: 5.8 },
      { qty: 10000, price: 5.2 }
    ]
  });

  // ─── PROTECTION ───

  await upsertProduct({
    sku: 'PR-BUBBLE-ROLL',
    name: 'Bubble Wrap Roll',
    slug: 'bubble-wrap-roll',
    categoryId: categories['protection'].id,
    productType: 'BUBBLE_WRAP',
    description: 'Standard bubble wrap roll for cushioning and protecting products during transit. 12" wide, 100m roll.',
    color: 'Transparent',
    dimensions: '12" × 100 meters',
    useCases: ['Fragile Items', 'Electronics', 'Glassware', 'All Products'],
    moq: 1,
    unit: 'roll',
    deliveryEstimate: '2–4 business days',
    stockStatus: 'In Stock',
    image: '/images/bubble-wrap.svg',
    tiers: [
      { qty: 1, price: 450 },
      { qty: 5, price: 420 },
      { qty: 10, price: 390 },
      { qty: 25, price: 360 },
      { qty: 50, price: 330 }
    ]
  });

  await upsertProduct({
    sku: 'PR-FOAM-SHEET',
    name: 'EPE Foam Sheet Pack',
    slug: 'epe-foam-sheet-pack',
    categoryId: categories['protection'].id,
    productType: 'FOAM',
    description: 'Soft EPE foam sheets for wrapping fragile items. Pack of 50 sheets, 12×12 inches.',
    color: 'White',
    dimensions: '12 × 12" (pack of 50)',
    useCases: ['Electronics', 'Ceramics', 'Fragile Items'],
    moq: 1,
    unit: 'pack',
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    image: '/images/foam-sheets.svg',
    tiers: [
      { qty: 1, price: 250 },
      { qty: 5, price: 230 },
      { qty: 10, price: 210 },
      { qty: 25, price: 190 },
      { qty: 50, price: 170 }
    ]
  });

  await upsertProduct({
    sku: 'PR-HONEYCOMB',
    name: 'Honeycomb Paper Wrap',
    slug: 'honeycomb-paper-wrap',
    categoryId: categories['protection'].id,
    productType: 'OTHER',
    description: 'Eco-friendly honeycomb paper wrap — a sustainable alternative to bubble wrap. Expands into a cushioning honeycomb pattern.',
    color: 'Brown Kraft',
    dimensions: '15" × 50 meters',
    useCases: ['Eco-Friendly Packaging', 'Fragile Items', 'Wrapping'],
    moq: 1,
    unit: 'roll',
    deliveryEstimate: '3–5 business days',
    stockStatus: 'In Stock',
    image: '/images/honeycomb-wrap.svg',
    tiers: [
      { qty: 1, price: 650 },
      { qty: 5, price: 600 },
      { qty: 10, price: 550 },
      { qty: 25, price: 500 },
      { qty: 50, price: 460 }
    ]
  });

  // ─── SEALING ───

  await upsertProduct({
    sku: 'SL-BOPP-CLEAR',
    name: 'BOPP Tape – Transparent',
    slug: 'bopp-tape-transparent',
    categoryId: categories['sealing'].id,
    productType: 'TAPE',
    description: 'Industrial-grade BOPP packing tape. Strong adhesive, 65 meters per roll. Essential for sealing corrugated boxes.',
    color: 'Transparent',
    dimensions: '2" × 65 meters',
    useCases: ['Box Sealing', 'All Packaging'],
    moq: 6,
    unit: 'roll',
    deliveryEstimate: '2–3 business days',
    stockStatus: 'In Stock',
    image: '/images/bopp-tape.svg',
    tiers: [
      { qty: 6, price: 55 },
      { qty: 12, price: 50 },
      { qty: 36, price: 45 },
      { qty: 72, price: 40 },
      { qty: 144, price: 36 }
    ]
  });

  await upsertProduct({
    sku: 'SL-BROWN-TAPE',
    name: 'Brown Packing Tape',
    slug: 'brown-packing-tape',
    categoryId: categories['sealing'].id,
    productType: 'TAPE',
    description: 'Brown BOPP packing tape that matches kraft boxes for a clean, professional look. 65 meters per roll.',
    color: 'Brown',
    dimensions: '2" × 65 meters',
    useCases: ['Box Sealing', 'Kraft Packaging'],
    moq: 6,
    unit: 'roll',
    deliveryEstimate: '2–3 business days',
    stockStatus: 'In Stock',
    image: '/images/brown-tape.svg',
    tiers: [
      { qty: 6, price: 58 },
      { qty: 12, price: 53 },
      { qty: 36, price: 48 },
      { qty: 72, price: 43 },
      { qty: 144, price: 39 }
    ]
  });

  await upsertProduct({
    sku: 'SL-LABELS-500',
    name: 'Thermal Shipping Labels (Roll of 500)',
    slug: 'thermal-shipping-labels-500',
    categoryId: categories['sealing'].id,
    productType: 'LABEL',
    description: 'Direct thermal shipping labels compatible with all major courier services. Roll of 500 labels, 4×6 inch.',
    color: 'White',
    dimensions: '4 × 6"',
    useCases: ['Shipping Labels', 'Courier Labels', 'Address Labels'],
    moq: 1,
    unit: 'roll',
    deliveryEstimate: '2–3 business days',
    stockStatus: 'In Stock',
    image: '/images/shipping-labels.svg',
    tiers: [
      { qty: 1, price: 320 },
      { qty: 5, price: 295 },
      { qty: 10, price: 270 },
      { qty: 25, price: 245 },
      { qty: 50, price: 220 }
    ]
  });

  // ─── BRANDING ───

  await upsertProduct({
    sku: 'BR-THANKYOU-100',
    name: 'Thank You Cards (Pack of 100)',
    slug: 'thank-you-cards-100',
    categoryId: categories['branding'].id,
    productType: 'CARD',
    description: 'Beautifully designed thank-you cards for your brand. Printed on premium 300 GSM art card stock.',
    color: 'Custom',
    dimensions: '4 × 6"',
    useCases: ['D2C Brands', 'Gift Orders', 'Brand Building'],
    moq: 100,
    unit: 'piece',
    deliveryEstimate: '5–7 business days',
    stockStatus: 'In Stock',
    image: '/images/thank-you-cards.svg',
    tiers: [
      { qty: 100, price: 3.5 },
      { qty: 500, price: 2.8 },
      { qty: 1000, price: 2.2 },
      { qty: 5000, price: 1.8 },
      { qty: 10000, price: 1.5 }
    ]
  });

  await upsertProduct({
    sku: 'BR-STICKERS-500',
    name: 'Brand Logo Stickers (Roll of 500)',
    slug: 'brand-logo-stickers-500',
    categoryId: categories['branding'].id,
    productType: 'STICKER',
    description: 'Custom brand logo stickers on a roll. Apply on boxes, bags, and mailers for professional brand presentation.',
    color: 'Custom',
    dimensions: '2" round',
    useCases: ['Branding', 'Box Sealing', 'Package Personalisation'],
    moq: 500,
    unit: 'piece',
    deliveryEstimate: '5–7 business days',
    stockStatus: 'In Stock',
    image: '/images/brand-stickers.svg',
    tiers: [
      { qty: 500, price: 1.5 },
      { qty: 1000, price: 1.2 },
      { qty: 2000, price: 1.0 },
      { qty: 5000, price: 0.8 },
      { qty: 10000, price: 0.6 }
    ]
  });

  await upsertProduct({
    sku: 'BR-PRINTED-TAPE',
    name: 'Custom Printed Tape',
    slug: 'custom-printed-tape',
    categoryId: categories['branding'].id,
    productType: 'TAPE',
    description: 'Custom printed BOPP tape with your brand logo and colors. Minimum order 36 rolls.',
    color: 'Custom',
    dimensions: '2" × 65 meters',
    useCases: ['Branding', 'Box Sealing', 'D2C'],
    moq: 36,
    unit: 'roll',
    deliveryEstimate: '7–10 business days',
    stockStatus: 'Made to Order',
    image: '/images/printed-tape.svg',
    tiers: [
      { qty: 36, price: 95 },
      { qty: 72, price: 85 },
      { qty: 144, price: 75 },
      { qty: 288, price: 65 },
      { qty: 500, price: 58 }
    ]
  });

  console.log('  ✅ Products (22 total)');
  console.log('✅ Seed complete!');
}

/* ── Helper Functions ── */

/** Find existing supplier ID by name or return a new UUID placeholder. */
async function findOrCreateSupplierId(name) {
  const existing = await prisma.supplier.findFirst({ where: { name } });
  if (existing) return existing.id;
  // Return a UUID that won't match — upsert will create a new record
  return '00000000-0000-0000-0000-000000000000';
}

/** Upsert a category by slug. */
async function upsertCategory(data) {
  return prisma.category.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      description: data.description,
      longDescription: data.longDescription,
      icon: data.icon,
      color: data.color,
      sortOrder: data.sortOrder,
      status: 'ACTIVE'
    },
    create: { ...data, status: 'ACTIVE' }
  });
}

/**
 * Upsert a product by SKU with all nested relations.
 * Converts FE-style price tiers (₹ float) to BE format (paise int).
 */
async function upsertProduct(data) {
  const {
    boxSpec,
    tiers,
    image,
    ...productFields
  } = data;

  const toPaise = (rupees) => Math.round(rupees * 100);

  // Check if product already exists by SKU or slug
  const existing = await prisma.product.findFirst({
    where: { OR: [{ sku: data.sku }, { slug: data.slug }] }
  });

  if (existing) {
    // Update existing product
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        sku: productFields.sku,
        name: productFields.name,
        slug: productFields.slug,
        description: productFields.description,
        color: productFields.color,
        dimensions: productFields.dimensions,
        useCases: productFields.useCases || [],
        notRecommendedFor: productFields.notRecommendedFor || [],
        moq: productFields.moq,
        deliveryEstimate: productFields.deliveryEstimate,
        stockStatus: productFields.stockStatus,
        supplierId: productFields.supplierId || null,
        unit: productFields.unit || 'piece',
        status: 'ACTIVE'
      }
    });

    // Replace tiers
    if (tiers) {
      await prisma.productPriceTier.deleteMany({ where: { productId: existing.id } });
      await prisma.productPriceTier.createMany({
        data: tiers.map((t) => ({
          productId: existing.id,
          minimumQuantity: t.qty,
          unitPriceMinor: toPaise(t.price),
          currency: 'INR'
        }))
      });
    }

    return existing;
  }

  // Create new product with all relations
  const product = await prisma.product.create({
    data: {
      ...productFields,
      useCases: productFields.useCases || [],
      notRecommendedFor: productFields.notRecommendedFor || [],
      unit: productFields.unit || 'piece',
      status: 'ACTIVE',
      ...(boxSpec && {
        boxSpecification: { create: boxSpec }
      }),
      ...(tiers && {
        priceTiers: {
          create: tiers.map((t) => ({
            minimumQuantity: t.qty,
            unitPriceMinor: toPaise(t.price),
            currency: 'INR'
          }))
        }
      }),
      ...(image && {
        images: {
          create: {
            url: image,
            altText: productFields.name,
            imageType: 'product',
            isPrimary: true,
            sortOrder: 0
          }
        }
      }),
      inventory: {
        create: {
          availableQuantity: 10000,
          reservedQuantity: 0,
          status: 'AVAILABLE'
        }
      }
    }
  });

  return product;
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
