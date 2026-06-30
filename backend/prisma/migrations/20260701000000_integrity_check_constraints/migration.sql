-- Defense-in-depth integrity constraints. These back up the application-level
-- guarded compare-and-set updates (atomic updateMany with the guard in WHERE)
-- so that even an unforeseen code path can never drive a balance or stock count
-- negative. Verified: zero existing rows violate these. Idempotent (safe to
-- re-run / apply by hand) via the pg_constraint existence checks.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_wallet_balance_nonneg') THEN
    ALTER TABLE "users" ADD CONSTRAINT users_wallet_balance_nonneg CHECK ("walletBalance" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_loyalty_points_nonneg') THEN
    ALTER TABLE "users" ADD CONSTRAINT users_loyalty_points_nonneg CHECK ("loyaltyPoints" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_qty_nonneg') THEN
    ALTER TABLE "products" ADD CONSTRAINT products_stock_qty_nonneg CHECK ("stockQty" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gift_cards_balance_nonneg') THEN
    ALTER TABLE "gift_cards" ADD CONSTRAINT gift_cards_balance_nonneg CHECK (balance >= 0);
  END IF;
END $$;
