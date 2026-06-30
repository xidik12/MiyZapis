-- POS gift-card redemption: track which gift card offset a POS sale and by how much.
ALTER TABLE "product_orders" ADD COLUMN IF NOT EXISTS "giftCardId" TEXT;
ALTER TABLE "product_orders" ADD COLUMN IF NOT EXISTS "giftCardAmount" DECIMAL NOT NULL DEFAULT 0;
