-- Add smsSent column to notifications table
ALTER TABLE "notifications" ADD COLUMN "smsSent" BOOLEAN NOT NULL DEFAULT false;