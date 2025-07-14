-- CreateTable
CREATE TABLE "MenuConfig" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuConfig_restaurantId_key" ON "MenuConfig"("restaurantId");

-- AddForeignKey
ALTER TABLE "MenuConfig" ADD CONSTRAINT "MenuConfig_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
