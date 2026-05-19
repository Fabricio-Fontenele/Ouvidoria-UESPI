-- CreateTable
CREATE TABLE "campuses" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administrative_units" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "campus_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "administrative_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campuses_is_active_idx" ON "campuses"("is_active");

-- CreateIndex
CREATE INDEX "administrative_units_campus_id_idx" ON "administrative_units"("campus_id");

-- CreateIndex
CREATE INDEX "administrative_units_is_active_idx" ON "administrative_units"("is_active");

-- CreateIndex
CREATE INDEX "administrative_units_campus_id_is_active_idx"
ON "administrative_units"("campus_id", "is_active");

-- AddForeignKey
ALTER TABLE "administrative_units"
ADD CONSTRAINT "administrative_units_campus_id_fkey"
FOREIGN KEY ("campus_id") REFERENCES "campuses"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
