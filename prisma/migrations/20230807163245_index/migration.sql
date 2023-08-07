-- CreateIndex
CREATE INDEX "document_updated_at_idx" ON "document"("updated_at");

-- for pg_bigm
CREATE INDEX "document_gin" ON "document" USING gin ("content" gin_bigm_ops, "title" gin_bigm_ops);