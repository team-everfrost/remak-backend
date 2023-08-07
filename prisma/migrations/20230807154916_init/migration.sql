-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_bigm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BASIC', 'PLUS', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('WEBPAGE', 'MEMO', 'IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SCRAPE_PENDING', 'SCRAPE_PROCESSING', 'SCRAPE_REJECTED', 'EMBED_PENDING', 'EMBED_PROCESSING', 'EMBED_REJECTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "image_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BASIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social" (
    "id" BIGSERIAL NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" BIGSERIAL NOT NULL,
    "doc_id" TEXT NOT NULL,
    "title" TEXT,
    "type" "DocumentType" NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "summary" TEXT,
    "status" "Status" NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embedded_text" (
    "id" BIGSERIAL NOT NULL,
    "document_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" "DocumentType",
    "chapter" TEXT,
    "content" TEXT,
    "start_page_number" INTEGER,
    "start_line_number" INTEGER,
    "end_page_number" INTEGER,
    "end_line_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vector" vector(1536),

    CONSTRAINT "embedded_text_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "signup_code" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToTag" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uid_key" ON "users"("uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "document_doc_id_key" ON "document"("doc_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_email_key" ON "email"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_DocumentToTag_AB_unique" ON "_DocumentToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DocumentToTag_B_index" ON "_DocumentToTag"("B");

-- AddForeignKey
ALTER TABLE "social" ADD CONSTRAINT "social_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embedded_text" ADD CONSTRAINT "embedded_text_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embedded_text" ADD CONSTRAINT "embedded_text_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToTag" ADD CONSTRAINT "_DocumentToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToTag" ADD CONSTRAINT "_DocumentToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
