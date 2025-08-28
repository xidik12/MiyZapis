-- Fix for missing autoBooking column in specialists table
-- Run this SQL in Railway Database Console to fix the 500 errors

-- Check if autoBooking column exists (this will show an error if it doesn't exist)
-- SELECT autoBooking FROM specialists LIMIT 1;

-- Add the missing autoBooking column
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "autoBooking" BOOLEAN NOT NULL DEFAULT false;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'specialists' AND column_name = 'autoBooking';

-- Show a few sample records to confirm
SELECT id, "businessName", "autoBooking" FROM specialists LIMIT 5;
