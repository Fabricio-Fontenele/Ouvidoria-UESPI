-- AlterTable
ALTER TABLE "manifestations"
ADD COLUMN "attendant_user_id" UUID;

-- AddForeignKey
ALTER TABLE "manifestations"
ADD CONSTRAINT "manifestations_attendant_user_id_fkey"
FOREIGN KEY ("attendant_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "manifestations_attendant_user_id_idx" ON "manifestations"("attendant_user_id");

-- CreateTable
CREATE TABLE "manifestation_evaluations" (
  "id" UUID NOT NULL,
  "manifestation_id" UUID NOT NULL,
  "attendant_user_id" UUID NOT NULL,
  "attendant_role_snapshot" "user_role" NOT NULL,
  "author_user_id" UUID NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "manifestation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manifestation_evaluations_manifestation_id_key"
ON "manifestation_evaluations"("manifestation_id");

-- CreateIndex
CREATE INDEX "manifestation_evaluations_attendant_user_id_idx"
ON "manifestation_evaluations"("attendant_user_id");

-- CreateIndex
CREATE INDEX "manifestation_evaluations_author_user_id_idx"
ON "manifestation_evaluations"("author_user_id");

-- AddForeignKey
ALTER TABLE "manifestation_evaluations"
ADD CONSTRAINT "manifestation_evaluations_manifestation_id_fkey"
FOREIGN KEY ("manifestation_id") REFERENCES "manifestations"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestation_evaluations"
ADD CONSTRAINT "manifestation_evaluations_attendant_user_id_fkey"
FOREIGN KEY ("attendant_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestation_evaluations"
ADD CONSTRAINT "manifestation_evaluations_author_user_id_fkey"
FOREIGN KEY ("author_user_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "manifestation_evaluations"
ADD CONSTRAINT "manifestation_evaluations_rating_check"
CHECK ("rating" BETWEEN 1 AND 5);
