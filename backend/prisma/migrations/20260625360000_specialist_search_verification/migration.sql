-- AddColumn: listedInSearch on specialists (default true = visible, preserves current behaviour)
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "listedInSearch" BOOLEAN NOT NULL DEFAULT true;

-- AddColumn: requireVerifiedCustomer on specialists (default false = guests allowed, preserves current behaviour)
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "requireVerifiedCustomer" BOOLEAN NOT NULL DEFAULT false;
