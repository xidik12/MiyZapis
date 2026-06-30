-- Telegram Stars recurring-subscription tracking on specialist_subscriptions. Additive.
ALTER TABLE "specialist_subscriptions" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "specialist_subscriptions" ADD COLUMN IF NOT EXISTS "telegramChargeId" TEXT;
ALTER TABLE "specialist_subscriptions" ADD COLUMN IF NOT EXISTS "telegramPayerId" TEXT;
