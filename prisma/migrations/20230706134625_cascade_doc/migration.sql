-- DropForeignKey
ALTER TABLE "document" DROP CONSTRAINT "document_user_id_fkey";

-- DropForeignKey
ALTER TABLE "social" DROP CONSTRAINT "social_user_id_fkey";

-- AddForeignKey
ALTER TABLE "social" ADD CONSTRAINT "social_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
