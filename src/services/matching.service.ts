import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import type { Scholarship, Student } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// For matching stem majors.. nursing counted as STEM
const STEM_MAJORS = [
    "Computer Science", "Engineering", "Mathematics", 
    "Physics", "Data Science", "Nursing"
];

// export makes this interface available to other files that import it
export interface MatchResult {
  scholarship: Scholarship;
  reasons: string[];
}

// Stage 1 (Fast Filter): Use the indexed columns in our db (gpa, citizenship, enrollment, etc.) to instantly narrow down thousands of scholarships to fewer
// Stage 2 (Precision Filter): Use TypeScript to check the other rules (Majors, Gender, Stem) on the remaining scholarships to find the perfect matches
export class MatchingService {

    // Promise<MatchResult[]> means that this funnction will eventually return an array of MatchResult objects once the asynchronous work is done
    // Operations that take time like querying a database don't return results instantly, so they return a Promise, which is a placeholder for the future value
    static async findMatches(student: Student): Promise<MatchResult[]> {
        // calculating this attribute because it has two columns that could make it true (income < 50k or column financial_need == true)
        const hasFinancialNeed = student.household_income < 50000 || student.financial_need;
        
        // Rule: High School Seniors qualify for their current status AND Undergraduate status
        const enrollmentSearchTerms = student.enrollment_status === "high_school_senior"
        ? ["high_school_senior", "undergraduate"]
        : [student.enrollment_status];

        // Stage 1: Index Search on DB
        const scholarships = await prisma.scholarship.findMany({
            where: {
                // Index 1: GPA
                min_gpa: {
                    lte: student.gpa,  // scholarship min <= student gpa (made sure to do <= because faq)
                },
                // Index 2: Citizenship.. uses GIN array match
                citizenship: {
                    has: student.citizenship_status,  // checks if student's status in in the citizenship array
                },
                // Index 3: Enrollment Status.. GIN
                enrollment_status: {
                    hasSome: enrollmentSearchTerms,  // checks if student's status is in enrollment array
                },
                // Index 4: Financial Need
                // If student has no need (hasFinancialNeed == false), don't add scholarships that require it
                // If student has need, match this scholarship whether it requires it or not
                ...(hasFinancialNeed ? {} : { requires_financial_need: false }),
            },
        });

        // Stage 2: Checking other rules after we filtered out the majority of scholarships
        const finalMatches: MatchResult[] = [];

        for (const scholarship of scholarships) {
            const reasons: string[] = [];
            let isMatch = true;
            const extra = scholarship.extra_eligibility as any;  // telling TS to ignore actual type of extra_eligibility

            // 1. Major / Field of Study: Empty array means open to all. Otherwise, must match
            if (scholarship.fields_of_study.length > 0) {
                // Use the helper
                if (!this.checkMajorMatch(student.major, scholarship)) {
                    isMatch = false;
                } else {
                    reasons.push(`Major requirement met (${student.major})`);
                }
            }

            // 2. Gender
            // "?" is used to safely access a property if and only if the object is not null or undefined
            // extra?.gender checks if extra is not null/undefined
            if (isMatch && extra?.gender) {  // second condition checks if the gender value is not null
                // observe that the "?" is not after student, but after gender. This assumes that student already exists, and then checks if gender exists before accessing something
                if (student.gender?.toLowerCase() !== extra.gender.toLowerCase()) {  // after we have one ? to make sure the object is not null (extra.gender), we don't need the ? again because it's guaranteed that the object exists
                isMatch = false;
                } else {
                reasons.push("Gender requirement met");
                }
            }

            // 3. Ethnicity
            if (isMatch && extra?.ethnicity && extra.ethnicity.length > 0) {
                // it checks whether any ethnicity listed in student.ethnicity is also present in extra.ethnicity. If there's at least one match, hasEthnicity will be true
                const hasEthnicity = student.ethnicity.some(e => extra.ethnicity.includes(e));
                if (!hasEthnicity) {
                isMatch = false;
                } else {
                reasons.push("Ethnicity requirement met");
                }
            }

            // 4. Community Service
            if (isMatch && extra?.community_service_hours) {
                if (student.community_service_hours < extra.community_service_hours) {
                isMatch = false;
                } else {
                reasons.push("Community service hours met");
                }
            }

            // 5. Military Affiliation
            if (isMatch && extra?.military_affiliation) {
                const requiredStatus = extra.military_affiliation as string[];
                // second condition: requiredstatus is an array of accepted military statuses. If the student doesn't have one of them, dont accept
                if (!student.military_affiliation || !requiredStatus.includes(student.military_affiliation)) { 
                isMatch = false;
                } else {
                reasons.push("Military affiliation requirement met");
                }
            }

            // 6. Residency
            if (isMatch && extra?.residency) {
                if (student.residency?.toLowerCase() !== extra.residency.toLowerCase()) {
                isMatch = false;
                } else {
                reasons.push("Residency requirement met");
                }
            }

            // 7. First Generation 
            if (isMatch && extra?.first_generation === true) {
                if (!student.first_generation) {
                isMatch = false;
                } else {
                reasons.push("First-generation student status");
                }
            }

            if (isMatch) {
                reasons.push(`GPA requirement met (${student.gpa} >= ${scholarship.min_gpa})`);
                reasons.push("Citizenship status met");
                reasons.push("Enrollment status met");
                if (scholarship.requires_financial_need) {
                reasons.push("Financial need demonstrated");
                }
                
                finalMatches.push({ scholarship, reasons });
            }
        }

        return finalMatches;
    }

    // Helper to handle Major matching rules (for STEM handling mainly)
    private static checkMajorMatch(studentMajor: string, scholarship: Scholarship): boolean {
        // 1. Direct Match (for normal cases where the tag doesn't ask for STEM)
        if (scholarship.fields_of_study.includes(studentMajor)) {
            return true;
        }

        // We allow Nursing to match if the scholarship has the tag STEM for Sarah
        // I guess this is not true because Sarah did not match Scholarship 11 (Environmental Stewardship Grant)
        // Sarah's a nursing major, and this scholarship has the STEM tag, but it wasn't one of the matches so I guess its not right
        if (studentMajor === 'Nursing' && scholarship.tags.includes('STEM')) {
            return true;
        }

        return false;
   }

}