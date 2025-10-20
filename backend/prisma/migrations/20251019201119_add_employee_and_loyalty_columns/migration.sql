-- Add optional employeeId column to bookings for business employee assignments
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'bookings'
      AND tc.constraint_name = 'bookings_employeeId_fkey'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "employees"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Ensure loyalty tier color and icon metadata exist
ALTER TABLE "loyalty_tiers"
  ADD COLUMN IF NOT EXISTS "color" TEXT,
  ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- Populate color and icon values for existing tiers
UPDATE "loyalty_tiers" SET
  "color" = COALESCE(NULLIF(TRIM("color"), ''), '#CD7F32'),
  "icon" = COALESCE(NULLIF(TRIM("icon"), ''), '🥉')
WHERE name = 'BRONZE';

UPDATE "loyalty_tiers" SET
  "color" = COALESCE(NULLIF(TRIM("color"), ''), '#C0C0C0'),
  "icon" = COALESCE(NULLIF(TRIM("icon"), ''), '🥈')
WHERE name = 'SILVER';

UPDATE "loyalty_tiers" SET
  "color" = COALESCE(NULLIF(TRIM("color"), ''), '#FFD700'),
  "icon" = COALESCE(NULLIF(TRIM("icon"), ''), '🥇')
WHERE name = 'GOLD';

UPDATE "loyalty_tiers" SET
  "color" = COALESCE(NULLIF(TRIM("color"), ''), '#E5E4E2'),
  "icon" = COALESCE(NULLIF(TRIM("icon"), ''), '👑')
WHERE name = 'PLATINUM';

-- Apply fallback defaults for any other tiers
UPDATE "loyalty_tiers" SET
  "color" = COALESCE(NULLIF(TRIM("color"), ''), '#CD7F32'),
  "icon" = COALESCE(NULLIF(TRIM("icon"), ''), '⭐');

-- Enforce NOT NULL constraints with sensible defaults
ALTER TABLE "loyalty_tiers"
  ALTER COLUMN "color" SET DEFAULT '#CD7F32',
  ALTER COLUMN "color" SET NOT NULL,
  ALTER COLUMN "icon" SET DEFAULT '🥉',
  ALTER COLUMN "icon" SET NOT NULL;
