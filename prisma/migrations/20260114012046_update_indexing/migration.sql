/*
  Warnings:

  - You are about to drop the column `eligibility` on the `Scholarship` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Scholarship_amount_idx";

-- DropIndex
DROP INDEX "Scholarship_deadline_idx";

-- AlterTable
ALTER TABLE "Scholarship" DROP COLUMN "eligibility",
ADD COLUMN     "citizenship" TEXT[],
ADD COLUMN     "enrollment_status" TEXT[],
ADD COLUMN     "extra_eligibility" JSONB,
ADD COLUMN     "min_gpa" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "requires_financial_need" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Scholarship_min_gpa_idx" ON "Scholarship"("min_gpa");

-- CreateIndex
CREATE INDEX "Scholarship_requires_financial_need_idx" ON "Scholarship"("requires_financial_need");

-- CreateIndex
CREATE INDEX "Scholarship_citizenship_idx" ON "Scholarship" USING GIN ("citizenship");

-- CreateIndex
CREATE INDEX "Scholarship_enrollment_status_idx" ON "Scholarship" USING GIN ("enrollment_status");
