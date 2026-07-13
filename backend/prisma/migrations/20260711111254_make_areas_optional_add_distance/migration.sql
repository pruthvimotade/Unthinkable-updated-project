/*
  Warnings:

  - The values [STANDARD,EXPRESS,SAME_DAY,SCHEDULED] on the enum `OrderType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "AssignmentStatus" ADD VALUE 'REASSIGNED';

-- AlterEnum
BEGIN;
CREATE TYPE "OrderType_new" AS ENUM ('B2B', 'B2C');
ALTER TABLE "orders" ALTER COLUMN "order_type" DROP DEFAULT;
ALTER TABLE "rate_cards" ALTER COLUMN "order_type" TYPE "OrderType_new" USING ("order_type"::text::"OrderType_new");
ALTER TABLE "orders" ALTER COLUMN "order_type" TYPE "OrderType_new" USING ("order_type"::text::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "OrderType_old";
ALTER TABLE "orders" ALTER COLUMN "order_type" SET DEFAULT 'B2C';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RateType" ADD VALUE 'INTRA_ZONE';
ALTER TYPE "RateType" ADD VALUE 'INTER_ZONE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'DISPATCHER';
ALTER TYPE "UserRole" ADD VALUE 'WAREHOUSE';

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_drop_area_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_pickup_area_id_fkey";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "distance_km" DECIMAL(10,2),
ADD COLUMN     "drop_address_line2" TEXT,
ADD COLUMN     "drop_latitude" DECIMAL(10,7),
ADD COLUMN     "drop_longitude" DECIMAL(10,7),
ADD COLUMN     "drop_place_id" TEXT,
ADD COLUMN     "estimated_duration" INTEGER,
ADD COLUMN     "pickup_address_line2" TEXT,
ADD COLUMN     "pickup_latitude" DECIMAL(10,7),
ADD COLUMN     "pickup_longitude" DECIMAL(10,7),
ADD COLUMN     "pickup_place_id" TEXT,
ALTER COLUMN "pickup_area_id" DROP NOT NULL,
ALTER COLUMN "drop_area_id" DROP NOT NULL,
ALTER COLUMN "order_type" SET DEFAULT 'B2C';

-- CreateTable
CREATE TABLE "status_override_logs" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "from_status" "OrderStatus" NOT NULL,
    "to_status" "OrderStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "overridden_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_override_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_override_logs_order_id_idx" ON "status_override_logs"("order_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_drop_area_id_fkey" FOREIGN KEY ("drop_area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_area_id_fkey" FOREIGN KEY ("pickup_area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_override_logs" ADD CONSTRAINT "status_override_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_override_logs" ADD CONSTRAINT "status_override_logs_overridden_by_id_fkey" FOREIGN KEY ("overridden_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
