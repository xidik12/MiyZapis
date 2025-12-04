-- Add trial period fields to users table
-- These fields track the 3-month free trial period for new users

-- Add trial start date column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "trialStartDate" TIMESTAMP(3);

-- Add trial end date column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3);

-- Add trial status flag with default true
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "isInTrial" BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to have NULL trial dates (they're already past trial)
-- And set isInTrial to false for existing users
UPDATE users
SET "isInTrial" = false
WHERE "trialStartDate" IS NULL;

-- Create index for efficient trial queries
CREATE INDEX IF NOT EXISTS "users_isInTrial_idx" ON users("isInTrial");
CREATE INDEX IF NOT EXISTS "users_trialEndDate_idx" ON users("trialEndDate");
