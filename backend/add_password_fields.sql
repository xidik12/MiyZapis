-- Safe migration to add password-related fields to users table
-- This will NOT delete existing data

-- Add passwordLastChanged field (nullable, so existing users won't be affected)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "passwordLastChanged" TIMESTAMP(3);

-- Add authProvider field (nullable, so existing users won't be affected)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS "authProvider" TEXT;

-- Update existing users who have passwords to set a reasonable passwordLastChanged date
-- (Only if they don't already have one set)
UPDATE users
SET "passwordLastChanged" = "createdAt"
WHERE password IS NOT NULL
AND "passwordLastChanged" IS NULL;

-- Update existing users based on how they likely authenticated
-- Users with telegramId likely authenticated via Telegram
UPDATE users
SET "authProvider" = 'telegram'
WHERE "telegramId" IS NOT NULL
AND "authProvider" IS NULL;

-- Users without telegramId and with passwords likely authenticated via email
UPDATE users
SET "authProvider" = 'email'
WHERE "telegramId" IS NULL
AND password IS NOT NULL
AND "authProvider" IS NULL;

-- The remaining users (no telegram, no password) are likely Google OAuth users
-- We'll set them when they log in next time, so leave as NULL for now

-- Verify the changes
SELECT COUNT(*) as total_users,
       COUNT("passwordLastChanged") as users_with_password_date,
       COUNT("authProvider") as users_with_auth_provider,
       COUNT(password) as users_with_password
FROM users;