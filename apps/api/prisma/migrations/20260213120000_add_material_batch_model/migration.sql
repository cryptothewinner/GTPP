-- CreateEnum
CREATE TYPE "MaterialBatchStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'QUARANTINE', 'EXPIRED', 'CONSUMED');

-- CreateTable
CREATE TABLE "material_batches" (
    "id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "supplier_lot_no" TEXT,
    "manufacturing_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "remaining_quantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "MaterialBatchStatus" NOT NULL DEFAULT 'AVAILABLE',
    "storage_location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_batches_batch_number_key" ON "material_batches"("batch_number");

-- CreateIndex
CREATE INDEX "material_batches_batch_number_idx" ON "material_batches"("batch_number");

-- CreateIndex
CREATE INDEX "material_batches_material_id_idx" ON "material_batches"("material_id");

-- CreateIndex
CREATE INDEX "material_batches_expiry_date_idx" ON "material_batches"("expiry_date");

-- CreateIndex
CREATE INDEX "material_batches_status_idx" ON "material_batches"("status");

-- AddForeignKey
ALTER TABLE "material_batches" ADD CONSTRAINT "material_batches_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

