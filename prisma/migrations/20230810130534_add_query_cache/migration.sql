-- CreateTable
CREATE TABLE "embedded_query" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "vector" vector(1536) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embedded_query_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "embedded_query_query_key" ON "embedded_query"("query");
