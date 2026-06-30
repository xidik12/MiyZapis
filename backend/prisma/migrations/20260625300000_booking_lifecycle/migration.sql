-- Migration: booking_lifecycle
-- Adds three fields to the "bookings" table for lifecycle automation:
--   confirmDeadlineAt   — when a PENDING booking's confirm window expires
--   reminded30Sent      — guard: 30-min customer reminder already sent
--   postApptConfirmSent — guard: post-appointment specialist prompt already sent

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "confirmDeadlineAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reminded30Sent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "postApptConfirmSent" BOOLEAN NOT NULL DEFAULT false;

-- Index to make the lifecycle worker's PENDING SLA query efficient
-- (status + confirmDeadlineAt is the hot path for block B)
CREATE INDEX IF NOT EXISTS "bookings_status_confirmDeadlineAt_idx"
  ON "bookings" ("status", "confirmDeadlineAt");
