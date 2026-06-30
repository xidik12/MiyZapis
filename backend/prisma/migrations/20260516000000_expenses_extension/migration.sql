-- Phase 1: expenses extension (tax flags, invoices, user tax regime)
-- Idempotent — safe to re-run.

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "isTaxDeductible" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "vatAmount" DECIMAL,
  ADD COLUMN IF NOT EXISTS "vendorName" TEXT,
  ADD COLUMN IF NOT EXISTS "vendorTaxId" TEXT;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "taxRegime" TEXT,
  ADD COLUMN IF NOT EXISTS "taxId" TEXT;

CREATE TABLE IF NOT EXISTS "invoices" (
  "id"             TEXT NOT NULL,
  "specialistId"   TEXT NOT NULL,
  "bookingId"      TEXT,
  "customerId"     TEXT,
  "invoiceNumber"  TEXT NOT NULL,
  "issueDate"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate"        TIMESTAMP(3),
  "clientName"     TEXT NOT NULL,
  "clientEmail"    TEXT,
  "clientAddress"  TEXT,
  "clientTaxId"    TEXT,
  "currency"       TEXT NOT NULL DEFAULT 'UAH',
  "subtotal"       DECIMAL NOT NULL,
  "taxRate"        DECIMAL NOT NULL DEFAULT 0,
  "taxAmount"      DECIMAL NOT NULL DEFAULT 0,
  "total"          DECIMAL NOT NULL,
  "amountPaid"     DECIMAL NOT NULL DEFAULT 0,
  "lineItems"      TEXT NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'DRAFT',
  "sentAt"         TIMESTAMP(3),
  "paidAt"         TIMESTAMP(3),
  "cancelledAt"    TIMESTAMP(3),
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX IF NOT EXISTS "invoices_specialistId_issueDate_idx" ON "invoices"("specialistId", "issueDate");
CREATE INDEX IF NOT EXISTS "invoices_specialistId_status_idx" ON "invoices"("specialistId", "status");
CREATE INDEX IF NOT EXISTS "invoices_bookingId_idx" ON "invoices"("bookingId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_specialistId_fkey') THEN
    ALTER TABLE "invoices"
      ADD CONSTRAINT "invoices_specialistId_fkey"
      FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
