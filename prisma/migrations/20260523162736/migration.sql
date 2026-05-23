-- DropForeignKey
ALTER TABLE "manifestation_messages" DROP CONSTRAINT "manifestation_messages_sender_user_id_fkey";

-- DropForeignKey
ALTER TABLE "manifestations" DROP CONSTRAINT "manifestations_attendant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "manifestations" DROP CONSTRAINT "manifestations_author_user_id_fkey";

-- AddForeignKey
ALTER TABLE "manifestations" ADD CONSTRAINT "manifestations_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestations" ADD CONSTRAINT "manifestations_attendant_user_id_fkey" FOREIGN KEY ("attendant_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestation_messages" ADD CONSTRAINT "manifestation_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "manifestations_status_campus_id_administrative_unit_id_created_" RENAME TO "manifestations_status_campus_id_administrative_unit_id_crea_idx";
