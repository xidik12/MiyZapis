-- AddTable: GuestOtp — stores hashed one-time codes for email-verified guest checkout.
-- Codes are never stored in plaintext; only a sha256 hex digest is persisted.
CREATE TABLE IF NOT EXISTS "guest_otps" (
    "id"          TEXT        NOT NULL,
    "email"       TEXT        NOT NULL,
    "phone"       TEXT,
    "name"        TEXT,
    "codeHash"    TEXT        NOT NULL,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "attempts"    INTEGER     NOT NULL DEFAULT 0,
    "consumedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "guest_otps_email_idx" ON "guest_otps"("email");

-- AddColumn: isGuest on users — marks passwordless shell accounts created by guest checkout.
-- Detectable also as (password IS NULL AND "authProvider" = 'guest') but explicit flag is cleaner.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isGuest" BOOLEAN NOT NULL DEFAULT false;
