-- Migration: crm_email_tracking
-- Adds open/click tracking to email campaigns.
-- Additive only — no destructive changes.

-- 1. New columns on segment_campaigns
ALTER TABLE "segment_campaigns" ADD COLUMN IF NOT EXISTS "openCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "segment_campaigns" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER NOT NULL DEFAULT 0;

-- 2. New table for per-recipient events
CREATE TABLE IF NOT EXISTS "campaign_events" (
  "id"          TEXT NOT NULL,
  "campaignId"  TEXT NOT NULL,
  "customerId"  TEXT NOT NULL,
  "type"        TEXT NOT NULL,   -- 'OPEN' | 'CLICK'
  "url"         TEXT,            -- original URL for CLICK events (NULL for OPEN)
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "campaign_events_pkey" PRIMARY KEY ("id")
);

-- 3. Index for fast campaign-scoped lookups
CREATE INDEX IF NOT EXISTS "campaign_events_campaignId_idx" ON "campaign_events"("campaignId");

-- 4. Unique constraint: one OPEN per recipient, one CLICK per recipient
--    (url included so multiple distinct URLs can each record one click)
--    For OPEN: url IS NULL so the triple (campaignId, customerId, 'OPEN') is naturally unique.
--    For CLICK: each unique URL is counted once per recipient.
--    We use a partial unique index for OPEN (url IS NULL) + a full unique for CLICK.
CREATE UNIQUE INDEX IF NOT EXISTS "campaign_events_open_unique"
  ON "campaign_events"("campaignId", "customerId", "type")
  WHERE "url" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_events_click_unique"
  ON "campaign_events"("campaignId", "customerId", "type", "url")
  WHERE "url" IS NOT NULL;
