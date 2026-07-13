-- AlterTable
ALTER TABLE "agent_statuses" ADD COLUMN     "acceptance_rate" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
ADD COLUMN     "rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
ADD COLUMN     "vehicle_type" TEXT NOT NULL DEFAULT 'BIKE';
