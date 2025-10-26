-- Check existing availability blocks
SELECT 
  COUNT(*) as total_blocks,
  MIN("startDateTime") as earliest_block,
  MAX("endDateTime") as latest_block,
  COUNT(DISTINCT DATE("startDateTime")) as unique_days
FROM "AvailabilityBlock"
WHERE "specialistId" = (SELECT id FROM "Specialist" LIMIT 1);

-- Show sample blocks
SELECT 
  "startDateTime",
  "endDateTime",
  "isAvailable",
  "reason"
FROM "AvailabilityBlock"
WHERE "specialistId" = (SELECT id FROM "Specialist" LIMIT 1)
ORDER BY "startDateTime"
LIMIT 10;
