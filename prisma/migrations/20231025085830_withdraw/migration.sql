-- AlterTable
ALTER TABLE "email" ADD COLUMN     "withdraw_code" TEXT,
ADD COLUMN     "withdraw_verified" BOOLEAN NOT NULL DEFAULT false;
