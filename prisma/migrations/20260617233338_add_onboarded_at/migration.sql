-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboardedAt" TIMESTAMP(3);

-- Existing users predate the onboarding flow — treat them as already onboarded
-- so they are never redirected to /dashboard/onboarding. Only users created
-- after this migration start out with onboardedAt = NULL.
UPDATE "users" SET "onboardedAt" = NOW() WHERE "onboardedAt" IS NULL;
