-- Add bank account details to specialists and payment methods
ALTER TABLE "specialists" ADD COLUMN "bankAccounts" TEXT;

ALTER TABLE "payment_methods" ADD COLUMN "bankName" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "accountName" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "qrImageUrl" TEXT;
