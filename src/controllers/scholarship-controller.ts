import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export class ScholarshipController {
  static async getAll(req: Request, res: Response) {
    try {
      // selecting all scholarships
      const scholarships = await prisma.scholarship.findMany({
        select: {
            id: true,
            name: true,
            amount: true,
            deadline: true,
            provider: true
        }
      });
      
      // Format dates by using a mapping function to iteration across each one, and transform the deadline
      const formatted = scholarships.map(s => ({
          ...s,
          deadline: s.deadline.toISOString().split('T')[0]
      }));

      res.json({
        scholarships: formatted,
        total: scholarships.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}