-- CreateTable: GuestInquiry
-- Public lead capture from the "Need packaging made for your brand?" section
CREATE TABLE IF NOT EXISTS "guest_inquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "business" TEXT,
    "productType" TEXT,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT 'INCH',
    "quantity" INTEGER,
    "printing" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guest_inquiries_status_idx" ON "guest_inquiries"("status");
CREATE INDEX IF NOT EXISTS "guest_inquiries_createdAt_idx" ON "guest_inquiries"("createdAt");

-- CreateTable: Bundle
-- Pre-configured packaging bundles editable via DB (no redeploy needed)
CREATE TABLE IF NOT EXISTS "bundles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "price" INTEGER,
    "originalPrice" INTEGER,
    "savings" INTEGER,
    "badge" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bundles_slug_key" ON "bundles"("slug");
CREATE INDEX IF NOT EXISTS "bundles_isActive_idx" ON "bundles"("isActive");
CREATE INDEX IF NOT EXISTS "bundles_sortOrder_idx" ON "bundles"("sortOrder");
