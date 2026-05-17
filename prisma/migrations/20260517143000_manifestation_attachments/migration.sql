CREATE TYPE "manifestation_attachment_uploaded_by_type" AS ENUM (
  'MANIFESTANT',
  'ANONYMOUS_MANIFESTANT',
  'OMBUDSMAN',
  'ADMIN'
);

CREATE TABLE "manifestation_attachments" (
  "id" UUID NOT NULL,
  "manifestation_id" UUID NOT NULL,
  "storage_key" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_in_bytes" INTEGER NOT NULL,
  "uploaded_by_type" "manifestation_attachment_uploaded_by_type" NOT NULL,
  "uploaded_by_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "manifestation_attachments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manifestation_attachments_storage_key_key" ON "manifestation_attachments"("storage_key");
CREATE INDEX "manifestation_attachments_manifestation_id_created_at_idx" ON "manifestation_attachments"("manifestation_id", "created_at");
CREATE INDEX "manifestation_attachments_uploaded_by_user_id_idx" ON "manifestation_attachments"("uploaded_by_user_id");

ALTER TABLE "manifestation_attachments"
  ADD CONSTRAINT "manifestation_attachments_manifestation_id_fkey"
  FOREIGN KEY ("manifestation_id")
  REFERENCES "manifestations"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "manifestation_attachments"
  ADD CONSTRAINT "manifestation_attachments_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
