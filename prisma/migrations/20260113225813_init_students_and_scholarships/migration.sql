-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "enrollment_status" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "gender" TEXT,
    "ethnicity" TEXT[],
    "citizenship_status" TEXT NOT NULL,
    "household_income" INTEGER NOT NULL,
    "financial_need" BOOLEAN NOT NULL DEFAULT false,
    "first_generation" BOOLEAN NOT NULL DEFAULT false,
    "military_affiliation" TEXT,
    "residency" TEXT,
    "community_service_hours" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "amount_type" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "eligibility" JSONB NOT NULL,
    "fields_of_study" TEXT[],
    "description" TEXT NOT NULL,
    "application_requirements" TEXT[],
    "renewable" BOOLEAN NOT NULL DEFAULT false,
    "renewable_conditions" TEXT,
    "url" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_gpa_idx" ON "Student"("gpa");

-- CreateIndex
CREATE INDEX "Student_major_idx" ON "Student"("major");

-- CreateIndex
CREATE INDEX "Scholarship_amount_idx" ON "Scholarship"("amount");

-- CreateIndex
CREATE INDEX "Scholarship_deadline_idx" ON "Scholarship"("deadline");
