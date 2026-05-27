CREATE TABLE "user_administrative_units" (
  "user_id" UUID NOT NULL,
  "administrative_unit_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_administrative_units_pkey" PRIMARY KEY ("user_id", "administrative_unit_id"),
  CONSTRAINT "user_administrative_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_administrative_units_administrative_unit_id_fkey" FOREIGN KEY ("administrative_unit_id") REFERENCES "administrative_units"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "user_administrative_units_administrative_unit_id_idx" ON "user_administrative_units"("administrative_unit_id");
CREATE INDEX "user_administrative_units_user_id_idx" ON "user_administrative_units"("user_id");
