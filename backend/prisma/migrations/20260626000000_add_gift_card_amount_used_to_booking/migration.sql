-- AddColumn: gift card amount applied to booking deposit (mirrors walletAmountUsed)
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "giftCardAmountUsed" DECIMAL NOT NULL DEFAULT 0.0;
