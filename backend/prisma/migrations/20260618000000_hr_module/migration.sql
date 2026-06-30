-- HR suite: staff attendance, leave/time-off, shifts.
-- Additive only — no data loss. Plain indexed columns (no FK), matching the
-- salon & CRM suite convention.

CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessId" TEXT,
    "staffUserId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clockIn" TIMESTAMP(3),
    "clockOut" TIMESTAMP(3),
    "minutesWorked" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_staffUserId_date_key" ON "attendance_records"("staffUserId", "date");
CREATE INDEX IF NOT EXISTS "attendance_records_ownerId_idx" ON "attendance_records"("ownerId");
CREATE INDEX IF NOT EXISTS "attendance_records_businessId_idx" ON "attendance_records"("businessId");
CREATE INDEX IF NOT EXISTS "attendance_records_staffUserId_date_idx" ON "attendance_records"("staffUserId", "date");

CREATE TABLE IF NOT EXISTS "leave_requests" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessId" TEXT,
    "staffUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'VACATION',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leave_requests_ownerId_idx" ON "leave_requests"("ownerId");
CREATE INDEX IF NOT EXISTS "leave_requests_businessId_idx" ON "leave_requests"("businessId");
CREATE INDEX IF NOT EXISTS "leave_requests_staffUserId_status_idx" ON "leave_requests"("staffUserId", "status");

CREATE TABLE IF NOT EXISTS "staff_shifts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessId" TEXT,
    "staffUserId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "staff_shifts_ownerId_idx" ON "staff_shifts"("ownerId");
CREATE INDEX IF NOT EXISTS "staff_shifts_businessId_idx" ON "staff_shifts"("businessId");
CREATE INDEX IF NOT EXISTS "staff_shifts_staffUserId_startTime_idx" ON "staff_shifts"("staffUserId", "startTime");
