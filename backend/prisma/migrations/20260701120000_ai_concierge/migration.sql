-- AI Concierge: entitlement field + conversation log
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "aiAccessUntil" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "concierge_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "message" TEXT NOT NULL,
    "reply" TEXT NOT NULL,
    "toolCalls" TEXT NOT NULL DEFAULT '[]',
    "options" TEXT NOT NULL DEFAULT '[]',
    "products" TEXT NOT NULL DEFAULT '[]',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "concierge_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "concierge_logs_userId_idx" ON "concierge_logs"("userId");
CREATE INDEX IF NOT EXISTS "concierge_logs_createdAt_idx" ON "concierge_logs"("createdAt");
