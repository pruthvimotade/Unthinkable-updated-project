/*
  Warnings:

  - You are about to drop the column `max_distance` on the `rate_cards` table. All the data in the column will be lost.
  - You are about to drop the column `min_distance` on the `rate_cards` table. All the data in the column will be lost.
  - Added the required column `order_type` to the `rate_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "rate_cards_rate_type_idx";

-- AlterTable
ALTER TABLE "rate_cards" DROP COLUMN "max_distance",
DROP COLUMN "min_distance",
ADD COLUMN     "cod_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "order_type" "OrderType" NOT NULL;

-- CreateIndex
CREATE INDEX "rate_cards_rate_type_order_type_idx" ON "rate_cards"("rate_type", "order_type");
