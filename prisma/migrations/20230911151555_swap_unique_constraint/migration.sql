/*
  Warnings:

  - A unique constraint covering the columns `[name,user_id]` on the table `collection` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "collection_user_id_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "collection_name_user_id_key" ON "collection"("name", "user_id");
