-- Delete ALL availability blocks for all specialists
DELETE FROM "AvailabilityBlock";

-- Verify deletion
SELECT COUNT(*) as remaining_blocks FROM "AvailabilityBlock";
