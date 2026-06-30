-- Phase 3: multi-specialist businesses / organisations.
-- Existing specialists remain standalone — businessId on related rows is optional.
-- Idempotent.

CREATE TABLE IF NOT EXISTS "businesses" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "ownerId"       TEXT NOT NULL,
  "email"         TEXT,
  "phone"         TEXT,
  "address"       TEXT,
  "websiteUrl"    TEXT,
  "logoUrl"       TEXT,
  "currency"      TEXT NOT NULL DEFAULT 'UAH',
  "timezone"      TEXT NOT NULL DEFAULT 'UTC',
  "taxId"         TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_slug_key" ON "businesses"("slug");
CREATE INDEX IF NOT EXISTS "businesses_ownerId_idx" ON "businesses"("ownerId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'businesses_ownerId_fkey') THEN
    ALTER TABLE "businesses"
      ADD CONSTRAINT "businesses_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "business_members" (
  "id"            TEXT NOT NULL,
  "businessId"    TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "role"          TEXT NOT NULL,   -- OWNER, MANAGER, SPECIALIST
  "invitedBy"     TEXT,
  "invitedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "joinedAt"      TIMESTAMP(3),
  "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "business_members_businessId_userId_key"
  ON "business_members"("businessId", "userId");
CREATE INDEX IF NOT EXISTS "business_members_userId_idx" ON "business_members"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'business_members_businessId_fkey') THEN
    ALTER TABLE "business_members"
      ADD CONSTRAINT "business_members_businessId_fkey"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'business_members_userId_fkey') THEN
    ALTER TABLE "business_members"
      ADD CONSTRAINT "business_members_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- Optional businessId on related rows. Specialists remain standalone if NULL.
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "businessId" TEXT;
ALTER TABLE "services"    ADD COLUMN IF NOT EXISTS "businessId" TEXT;
ALTER TABLE "bookings"    ADD COLUMN IF NOT EXISTS "businessId" TEXT;

CREATE INDEX IF NOT EXISTS "specialists_businessId_idx" ON "specialists"("businessId");
CREATE INDEX IF NOT EXISTS "services_businessId_idx" ON "services"("businessId");
CREATE INDEX IF NOT EXISTS "bookings_businessId_idx" ON "bookings"("businessId");
