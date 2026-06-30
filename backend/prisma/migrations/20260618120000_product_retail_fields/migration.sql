-- Retail/POS product fields: barcode, photo, expiry. Additive only.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "products_barcode_idx" ON "products"("barcode");
