-- Dodo Payments subscription tracking. Additive.
ALTER TABLE "specialist_subscriptions" ADD COLUMN IF NOT EXISTS "dodoSubscriptionId" TEXT;
ALTER TABLE "specialist_subscriptions" ADD COLUMN IF NOT EXISTS "dodoCustomerId" TEXT;
