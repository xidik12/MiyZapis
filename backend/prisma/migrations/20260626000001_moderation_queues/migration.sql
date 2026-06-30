-- Add verification queue fields to Specialist
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "verificationRequestedAt" TIMESTAMP(3);
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "verificationNote" TEXT;

-- Add resolution fields to post_reports
ALTER TABLE "post_reports" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "post_reports" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "post_reports" ADD COLUMN IF NOT EXISTS "reviewedByAdmin" TEXT;
ALTER TABLE "post_reports" ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT;
