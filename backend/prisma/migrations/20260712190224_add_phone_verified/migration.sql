-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "respond_by_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;
