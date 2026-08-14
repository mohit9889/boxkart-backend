-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductType" ADD VALUE 'COURIER_BAG';
ALTER TYPE "ProductType" ADD VALUE 'BUBBLE_WRAP';
ALTER TYPE "ProductType" ADD VALUE 'FOAM';
ALTER TYPE "ProductType" ADD VALUE 'STICKER';
ALTER TYPE "ProductType" ADD VALUE 'LABEL';
ALTER TYPE "ProductType" ADD VALUE 'CARD';

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "color" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "longDescription" TEXT;

-- AlterTable
ALTER TABLE "product_images" ADD COLUMN     "imageType" TEXT NOT NULL DEFAULT 'product';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "color" TEXT,
ADD COLUMN     "deliveryEstimate" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "notRecommendedFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stockStatus" TEXT DEFAULT 'In Stock',
ADD COLUMN     "supplierId" UUID,
ADD COLUMN     "useCases" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "rating" DECIMAL(3,2),
    "leadTime" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
