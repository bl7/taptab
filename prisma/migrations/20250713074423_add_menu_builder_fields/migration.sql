-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;
