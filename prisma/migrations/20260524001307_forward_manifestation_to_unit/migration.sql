-- AlterEnum
ALTER TYPE "manifestation_status" ADD VALUE 'awaiting_unit';

-- AlterTable
ALTER TABLE "manifestations" ADD COLUMN     "forwarded_to_unit_id" TEXT;

-- CreateIndex
CREATE INDEX "manifestations_forwarded_to_unit_id_idx" ON "manifestations"("forwarded_to_unit_id");

-- AddForeignKey
ALTER TABLE "manifestations" ADD CONSTRAINT "manifestations_forwarded_to_unit_id_fkey" FOREIGN KEY ("forwarded_to_unit_id") REFERENCES "administrative_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
