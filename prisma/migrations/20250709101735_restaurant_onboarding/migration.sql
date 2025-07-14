/*
  Warnings:

  - Added the required column `updatedAt` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'NPR',
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "timeZone" TEXT DEFAULT 'Asia/Kathmandu',
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set updatedAt to now() for existing rows
UPDATE "Restaurant" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;

-- Make updatedAt NOT NULL
ALTER TABLE "Restaurant" ALTER COLUMN "updatedAt" SET NOT NULL;
