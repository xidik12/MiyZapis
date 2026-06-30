-- POS upgrades: discount column, paymentMethod column. Additive only.
ALTER TABLE "product_orders" ADD COLUMN IF NOT EXISTS "discount" DECIMAL NOT NULL DEFAULT 0;
ALTER TABLE "product_orders" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
