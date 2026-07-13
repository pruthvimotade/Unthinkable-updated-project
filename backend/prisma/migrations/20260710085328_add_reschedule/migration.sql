-- CreateTable
CREATE TABLE "reschedules" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reschedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reschedules_order_id_idx" ON "reschedules"("order_id");

-- AddForeignKey
ALTER TABLE "reschedules" ADD CONSTRAINT "reschedules_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
