-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('manifestant', 'ombudsman', 'admin');

-- CreateEnum
CREATE TYPE "manifestation_type" AS ENUM ('report', 'complaint', 'suggestion', 'compliment');

-- CreateEnum
CREATE TYPE "manifestation_status" AS ENUM ('in_analysis', 'answered', 'canceled', 'finalized');

-- CreateEnum
CREATE TYPE "manifestation_message_sender_type" AS ENUM (
  'manifestant',
  'anonymous_manifestant',
  'ombudsman',
  'admin',
  'system'
);

-- CreateTable
CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "user_role" NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifestations" (
  "id" UUID NOT NULL,
  "protocol" TEXT NOT NULL,
  "type" "manifestation_type" NOT NULL,
  "status" "manifestation_status" NOT NULL DEFAULT 'in_analysis',
  "campus_id" TEXT NOT NULL,
  "administrative_unit_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "involved_people" TEXT,
  "author_user_id" UUID,
  "access_code_hash" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "manifestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifestation_messages" (
  "id" UUID NOT NULL,
  "manifestation_id" UUID NOT NULL,
  "sender_user_id" UUID,
  "sender_type" "manifestation_message_sender_type" NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "manifestation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "manifestations_protocol_key" ON "manifestations"("protocol");

-- CreateIndex
CREATE INDEX "manifestations_author_user_id_idx" ON "manifestations"("author_user_id");

-- CreateIndex
CREATE INDEX "manifestations_status_idx" ON "manifestations"("status");

-- CreateIndex
CREATE INDEX "manifestations_type_idx" ON "manifestations"("type");

-- CreateIndex
CREATE INDEX "manifestations_campus_id_idx" ON "manifestations"("campus_id");

-- CreateIndex
CREATE INDEX "manifestations_administrative_unit_id_idx" ON "manifestations"("administrative_unit_id");

-- CreateIndex
CREATE INDEX "manifestations_created_at_idx" ON "manifestations"("created_at");

-- CreateIndex
CREATE INDEX "manifestations_status_created_at_idx" ON "manifestations"("status", "created_at");

-- CreateIndex
CREATE INDEX "manifestations_campus_id_administrative_unit_id_idx" ON "manifestations"("campus_id", "administrative_unit_id");

-- CreateIndex
CREATE INDEX "manifestations_status_campus_id_administrative_unit_id_created_at_idx"
  ON "manifestations"("status", "campus_id", "administrative_unit_id", "created_at");

-- CreateIndex
CREATE INDEX "manifestation_messages_manifestation_id_created_at_idx"
  ON "manifestation_messages"("manifestation_id", "created_at");

-- CreateIndex
CREATE INDEX "manifestation_messages_sender_user_id_idx" ON "manifestation_messages"("sender_user_id");

-- AddForeignKey
ALTER TABLE "manifestations"
ADD CONSTRAINT "manifestations_author_user_id_fkey"
FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestation_messages"
ADD CONSTRAINT "manifestation_messages_manifestation_id_fkey"
FOREIGN KEY ("manifestation_id") REFERENCES "manifestations"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestation_messages"
ADD CONSTRAINT "manifestation_messages_sender_user_id_fkey"
FOREIGN KEY ("sender_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "manifestations"
ADD CONSTRAINT "manifestations_author_or_access_code_check"
CHECK (
  (
    "author_user_id" IS NOT NULL
    AND "access_code_hash" IS NULL
  )
  OR
  (
    "author_user_id" IS NULL
    AND "access_code_hash" IS NOT NULL
  )
);

-- AddCheckConstraint
ALTER TABLE "manifestation_messages"
ADD CONSTRAINT "manifestation_messages_sender_user_consistency_check"
CHECK (
  (
    "sender_type" IN ('manifestant', 'ombudsman', 'admin')
    AND "sender_user_id" IS NOT NULL
  )
  OR
  (
    "sender_type" IN ('anonymous_manifestant', 'system')
    AND "sender_user_id" IS NULL
  )
);
