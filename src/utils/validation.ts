import { z } from 'zod';

// We are ensuring that the data send to POST /students is valid before we try to put it in the database. 

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gpa: z.number().min(0).max(4.0),
  major: z.string().min(1),
  enrollment_status: z.enum(['high_school_senior', 'undergraduate', 'graduate']),
  citizenship_status: z.string(),
  graduation_year: z.number().int().default(new Date().getFullYear() + 4),
  household_income: z.number().nonnegative(),
  financial_need: z.boolean().optional(),
  first_generation: z.boolean().optional(),
  gender: z.string().optional(),
  ethnicity: z.array(z.string()).optional(),
  residency: z.string().optional(),
  military_affiliation: z.string().optional(),
  community_service_hours: z.number().nonnegative().optional(),
  state: z.string().length(2)
});