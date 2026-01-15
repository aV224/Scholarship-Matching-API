import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createStudentSchema } from '../utils/validation.js';
import { MatchingService } from '../services/matching.service.js';
import { AIService } from '../services/ai-service.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class StudentController {

    /**
     * POST /api/students
     * Creates a student with a "stu_XXX" ID
     */
    static async create(req: Request, res: Response) {
        try {
            // 1. Validate Input with Zod. I don't want to push bad data into my student database
            const validatedData = createStudentSchema.parse(req.body);
            

            // 2. Generate ID
            const count = await prisma.student.count();
            const nextId = `stu_${(count + 1).toString().padStart(3, '0')}`;

            //3. Save to Database
            const student = await prisma.student.create({
                data: {
                    id: nextId,
                    ...validatedData,
                    gender: validatedData.gender ?? null,  // if undefined, make them null. this is for type safety
                    residency: validatedData.residency ?? null,
                    military_affiliation: validatedData.military_affiliation ?? null,
                    financial_need: validatedData.financial_need ?? (validatedData.household_income < 50000),
                    first_generation: validatedData.first_generation ?? false,
                    community_service_hours: validatedData.community_service_hours ?? 0,
                    ethnicity: validatedData.ethnicity ?? []
                }
            });

            // 4. Return Response
            res.status(201).json({
                id: student.id,
                name: student.name,
                email: student.email,
                created_at: student.createdAt
            });
        } catch(error: any) {
          if (error.name === 'ZodError') {
            return res.status(400).json({ error: error.errors });
          }
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });  
        }
    }

    /**
     * GET /api/students/:id/matches
     * Gets all matches for a student + AI Explanation
     */
    static async getMatches(req: Request, res: Response) {
        try {
            const { id } = req.params;  // extracts the id from the request
            
            // Because I kept getting a vscode error here. I have to make sure that the id is a string.. typecheck
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: "Invalid ID provided" });
            }

            // 1. Fetch Student
            const student = await prisma.student.findUnique({ where: { id } });
            if (!student) return res.status(404).json({ error: "Student not found" });

            // 2. Get matches
            const matches = await MatchingService.findMatches(student);

            // 3. Process Matches & Generate AI Explanation
            // Only generate AI text for the top match to save time/cost.
            
            // Sort by Amount with the highest being first
            matches.sort((a, b) => b.scholarship.amount - a.scholarship.amount);
            
            // a mapping function that goes one by one, and transforms the first to add the AI explanation
            const formattedMatches = await Promise.all(matches.map(async (match, index) => {
                let explanation = null;

                // Only call AI for the top match
                if (index === 0) {
                    explanation = await AIService.generateExplanation(student, match.scholarship);
                }

                return {
                scholarship: {
                    id: match.scholarship.id,
                    name: match.scholarship.name,
                    amount: match.scholarship.amount,
                    provider: match.scholarship.provider,
                    deadline: match.scholarship.deadline.toISOString().split('T')[0],
                    url: match.scholarship.url
                },
                match_reasons: match.reasons,
                explanation: explanation // Will be string for top match and null for others
                };
            }));

            // 4. Calculate Totals
            const totalPotentialAid = matches.reduce((sum, m) => sum + m.scholarship.amount, 0);

            res.json({
                student_id: student.id,
                student_name: student.name,
                total_matches: matches.length,
                total_potential_aid: totalPotentialAid,
                matches: formattedMatches
            });

        } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
        }
  }
}