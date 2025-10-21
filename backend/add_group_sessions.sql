-- Add group session support to services and bookings
-- This allows services like yoga classes, art classes, etc. where multiple people can book the same session

-- Add group session fields to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS "isGroupSession" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS "maxParticipants" INTEGER;

ALTER TABLE services
ADD COLUMN IF NOT EXISTS "minParticipants" INTEGER DEFAULT 1;

-- Add current participants count to bookings for tracking
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS "participantCount" INTEGER NOT NULL DEFAULT 1;

-- Add group session booking ID (to link multiple bookings to same session)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS "groupSessionId" TEXT;

-- Create index for efficient group session queries
CREATE INDEX IF NOT EXISTS "services_isGroupSession_idx" ON services("isGroupSession");
CREATE INDEX IF NOT EXISTS "bookings_groupSessionId_idx" ON bookings("groupSessionId");
CREATE INDEX IF NOT EXISTS "bookings_scheduledAt_serviceId_idx" ON bookings("scheduledAt", "serviceId");

-- Add comments for documentation
COMMENT ON COLUMN services."isGroupSession" IS 'Whether this service supports group bookings (multiple customers at same time)';
COMMENT ON COLUMN services."maxParticipants" IS 'Maximum number of participants for group sessions (NULL = unlimited)';
COMMENT ON COLUMN services."minParticipants" IS 'Minimum number of participants required to run the session';
COMMENT ON COLUMN bookings."participantCount" IS 'Number of participants in this booking (default 1 for individual sessions)';
COMMENT ON COLUMN bookings."groupSessionId" IS 'Links multiple bookings to the same group session (format: {serviceId}_{scheduledAt})';
