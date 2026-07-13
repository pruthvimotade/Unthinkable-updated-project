-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reset_password_expires_at" TIMESTAMP(3),
ADD COLUMN     "reset_password_token_hash" TEXT,
ADD COLUMN     "verification_expires_at" TIMESTAMP(3),
ADD COLUMN     "verification_token_hash" TEXT;
