-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT;
ALTER TABLE "Menu"
ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now();
