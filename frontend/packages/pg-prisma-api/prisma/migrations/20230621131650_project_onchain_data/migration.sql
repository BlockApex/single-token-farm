-- AlterTable
ALTER TABLE "mantle_launchpad_metadata" ADD COLUMN     "owner" TEXT,
ADD COLUMN     "privateEndTime" TIMESTAMP(3),
ADD COLUMN     "privatePrice" DECIMAL(65,30),
ADD COLUMN     "privateStartTime" TIMESTAMP(3),
ADD COLUMN     "publicEndTime" TIMESTAMP(3),
ADD COLUMN     "publicPrice" DECIMAL(65,30),
ADD COLUMN     "publicStartTime" TIMESTAMP(3),
ADD COLUMN     "saleToken" TEXT,
ADD COLUMN     "totalSale" DECIMAL(65,30),
ADD COLUMN     "totalSold" DECIMAL(65,30),
ADD COLUMN     "vestingToken" TEXT;
