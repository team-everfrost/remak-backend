/*
  Warnings:

  - You are about to drop the column `picture` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "picture",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "refreshToken" TEXT;
