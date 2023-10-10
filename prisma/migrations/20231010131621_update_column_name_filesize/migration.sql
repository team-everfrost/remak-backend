/*
  Warnings:

  - You are about to drop the column `fileSize` on the `document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document" DROP COLUMN "fileSize",
ADD COLUMN     "file_size" BIGINT;
