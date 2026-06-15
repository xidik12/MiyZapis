-- Promoted listing creative (platform-curated marketplace ad). 1:1 with Specialist.
-- Additive only — no data loss.
CREATE TABLE IF NOT EXISTS "promotions" (
    "id" TEXT NOT NULL,
    "specialistId" TEXT NOT NULL,
    "headline" TEXT,
    "offerText" TEXT,
    "imageUrl" TEXT,
    "logoUrl" TEXT,
    "accentColor" TEXT DEFAULT '#5b6b3a',
    "highlightServiceId" TEXT,
    "ctaLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "promotions_specialistId_key" ON "promotions"("specialistId");
CREATE INDEX IF NOT EXISTS "promotions_status_idx" ON "promotions"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'promotions_specialistId_fkey'
    ) THEN
        ALTER TABLE "promotions"
            ADD CONSTRAINT "promotions_specialistId_fkey"
            FOREIGN KEY ("specialistId") REFERENCES "specialists"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
