-- CreateTable
CREATE TABLE "collection" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "user_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionToDocument" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_user_id_name_key" ON "collection"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToDocument_AB_unique" ON "_CollectionToDocument"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToDocument_B_index" ON "_CollectionToDocument"("B");

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToDocument" ADD CONSTRAINT "_CollectionToDocument_A_fkey" FOREIGN KEY ("A") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToDocument" ADD CONSTRAINT "_CollectionToDocument_B_fkey" FOREIGN KEY ("B") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
