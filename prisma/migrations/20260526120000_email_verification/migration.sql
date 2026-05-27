ALTER TABLE "users"
ADD COLUMN "email_verified_at" TIMESTAMPTZ(6),
ADD COLUMN "email_verification_code_hash" TEXT,
ADD COLUMN "email_verification_code_expires_at" TIMESTAMPTZ(6);

CREATE INDEX "users_email_verified_at_idx" ON "users"("email_verified_at");
