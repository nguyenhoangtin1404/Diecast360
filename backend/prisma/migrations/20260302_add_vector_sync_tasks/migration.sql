-- CreateTable
CREATE TABLE "vector_sync_tasks" (
    "item_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vector_sync_tasks_pkey" PRIMARY KEY ("item_id"),
    CONSTRAINT "vector_sync_tasks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "vector_sync_tasks_scheduled_at_idx" ON "vector_sync_tasks"("scheduled_at");
