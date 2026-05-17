-- CreateTable
CREATE TABLE "campuses" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_units" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "campus_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "administrative_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "administrative_units_campus_id_idx" ON "administrative_units"("campus_id");

-- AddForeignKey
ALTER TABLE "administrative_units"
ADD CONSTRAINT "administrative_units_campus_id_fkey"
FOREIGN KEY ("campus_id") REFERENCES "campuses"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
