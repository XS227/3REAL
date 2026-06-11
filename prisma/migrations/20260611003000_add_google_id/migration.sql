-- AlterTable
ALTER TABLE "users" ADD COLUMN "googleId" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
