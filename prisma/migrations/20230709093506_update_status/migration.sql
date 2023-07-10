/*
  Warnings:

  - The values [PENDING,PROCESSING,APPROVED,REJECTED] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('SCRAPE_PENDING', 'SCRAPE_PROCESSING', 'SCRAPE_REJECTED', 'EMBED_PENDING', 'EMBED_PROCESSING', 'EMBED_REJECTED', 'COMPLETED');

-- update existing values
UPDATE "document" SET "status" = 'EMBED_PENDING' WHERE "status" = 'PENDING';
-- continue for all other values...

ALTER TABLE "document" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "document" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
ALTER TABLE "document" ALTER COLUMN "status" SET DEFAULT 'SCRAPE_PENDING';
COMMIT;
