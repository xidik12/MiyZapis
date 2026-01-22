-- Add engagement metrics to reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "dislikeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: review_reactions
CREATE TABLE IF NOT EXISTS "review_reactions" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_reports
CREATE TABLE IF NOT EXISTS "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedByAdmin" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_responses
CREATE TABLE IF NOT EXISTS "review_responses" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_response_reactions
CREATE TABLE IF NOT EXISTS "review_response_reactions" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_response_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: review_reactions indexes
CREATE INDEX IF NOT EXISTS "review_reactions_reviewId_idx" ON "review_reactions"("reviewId");
CREATE INDEX IF NOT EXISTS "review_reactions_userId_idx" ON "review_reactions"("userId");

-- CreateIndex: review_reports indexes
CREATE INDEX IF NOT EXISTS "review_reports_reviewId_idx" ON "review_reports"("reviewId");
CREATE INDEX IF NOT EXISTS "review_reports_reportedBy_idx" ON "review_reports"("reportedBy");
CREATE INDEX IF NOT EXISTS "review_reports_status_idx" ON "review_reports"("status");
CREATE INDEX IF NOT EXISTS "review_reports_createdAt_idx" ON "review_reports"("createdAt");

-- CreateIndex: review_responses indexes
CREATE INDEX IF NOT EXISTS "review_responses_reviewId_idx" ON "review_responses"("reviewId");

-- CreateIndex: review_response_reactions indexes
CREATE INDEX IF NOT EXISTS "review_response_reactions_responseId_idx" ON "review_response_reactions"("responseId");
CREATE INDEX IF NOT EXISTS "review_response_reactions_userId_idx" ON "review_response_reactions"("userId");

-- CreateIndex: review_reactions unique constraint (one reaction per user per review)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reactions_reviewId_userId_key'
    ) THEN
        ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_reviewId_userId_key" UNIQUE ("reviewId", "userId");
    END IF;
END $$;

-- CreateIndex: review_reports unique constraint (prevent duplicate reports from same user)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reports_reviewId_reportedBy_key'
    ) THEN
        ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_reportedBy_key" UNIQUE ("reviewId", "reportedBy");
    END IF;
END $$;

-- CreateIndex: review_responses unique constraint (one response per review)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_responses_reviewId_key'
    ) THEN
        ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_reviewId_key" UNIQUE ("reviewId");
    END IF;
END $$;

-- CreateIndex: review_response_reactions unique constraint (one reaction per user per response)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_response_reactions_responseId_userId_key'
    ) THEN
        ALTER TABLE "review_response_reactions" ADD CONSTRAINT "review_response_reactions_responseId_userId_key" UNIQUE ("responseId", "userId");
    END IF;
END $$;

-- AddForeignKey: review_reactions -> reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reactions_reviewId_fkey'
    ) THEN
        ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_reactions -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reactions_userId_fkey'
    ) THEN
        ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_reports -> reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reports_reviewId_fkey'
    ) THEN
        ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_reports -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_reports_reportedBy_fkey'
    ) THEN
        ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_responses -> reviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_responses_reviewId_fkey'
    ) THEN
        ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_response_reactions -> review_responses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_response_reactions_responseId_fkey'
    ) THEN
        ALTER TABLE "review_response_reactions" ADD CONSTRAINT "review_response_reactions_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "review_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: review_response_reactions -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_response_reactions_userId_fkey'
    ) THEN
        ALTER TABLE "review_response_reactions" ADD CONSTRAINT "review_response_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create trigger function to update review reaction counts
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = NEW."reviewId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = NEW."reviewId" AND "reactionType" = 'dislike')
    WHERE id = NEW."reviewId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = OLD."reviewId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = OLD."reviewId" AND "reactionType" = 'dislike')
    WHERE id = OLD."reviewId";
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE reviews
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = NEW."reviewId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_reactions WHERE "reviewId" = NEW."reviewId" AND "reactionType" = 'dislike')
    WHERE id = NEW."reviewId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review reactions
DROP TRIGGER IF EXISTS review_reactions_count_trigger ON review_reactions;
CREATE TRIGGER review_reactions_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_reactions
FOR EACH ROW
EXECUTE FUNCTION update_review_reaction_counts();

-- Create trigger function to update review response reaction counts
CREATE OR REPLACE FUNCTION update_review_response_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE review_responses
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = NEW."responseId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = NEW."responseId" AND "reactionType" = 'dislike')
    WHERE id = NEW."responseId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE review_responses
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = OLD."responseId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = OLD."responseId" AND "reactionType" = 'dislike')
    WHERE id = OLD."responseId";
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE review_responses
    SET
      "likeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = NEW."responseId" AND "reactionType" = 'like'),
      "dislikeCount" = (SELECT COUNT(*) FROM review_response_reactions WHERE "responseId" = NEW."responseId" AND "reactionType" = 'dislike')
    WHERE id = NEW."responseId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review response reactions
DROP TRIGGER IF EXISTS review_response_reactions_count_trigger ON review_response_reactions;
CREATE TRIGGER review_response_reactions_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON review_response_reactions
FOR EACH ROW
EXECUTE FUNCTION update_review_response_reaction_counts();
