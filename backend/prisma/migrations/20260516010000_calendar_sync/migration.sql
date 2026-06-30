-- Phase 2: Google Calendar one-way sync (push booking → calendar event).
-- Idempotent.

CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "provider"        TEXT NOT NULL,
  "providerAccountId" TEXT,
  "accessToken"     TEXT NOT NULL,
  "refreshToken"    TEXT,
  "tokenExpiresAt"  TIMESTAMP(3),
  "scope"           TEXT,
  "calendarId"      TEXT NOT NULL DEFAULT 'primary',
  "calendarName"    TEXT,
  "syncEnabled"     BOOLEAN NOT NULL DEFAULT TRUE,
  "lastSyncAt"      TIMESTAMP(3),
  "lastSyncError"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_userId_provider_key"
  ON "calendar_connections"("userId", "provider");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'calendar_connections_userId_fkey') THEN
    ALTER TABLE "calendar_connections"
      ADD CONSTRAINT "calendar_connections_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "calendarEventIdCustomer"   TEXT,
  ADD COLUMN IF NOT EXISTS "calendarEventIdSpecialist" TEXT;
