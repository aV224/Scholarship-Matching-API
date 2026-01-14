// seed.ts will parse the nested JSON and move the indexed fields into their own columns while keeping the rest in the JSONB field. 

import 'dotenv/config';
// import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";  // Imports everything from Node's built in file system module (fs). Essential for reading seed data from files
import * as path from "path";  // Helps safely constructing & manipulating file paths
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// The Prisma Client gives us type-safe access to our database based on the prisma schema 
// const prisma = new PrismaClient();

// 1. Create a PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Create the Prisma Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Client
const prisma = new PrismaClient({ adapter });

// async keyword allows you to use "await" in this function, which is needed for handling asynchronous operations like reading files or querying a db
async function main() {
    console.log("Starting Seeding Process (Parsing JSON)...");

    // 1. Get File Paths
    // __dirname is a global variable that contains the path to the directory of the current script file (seed.ts)
    // ".." moves up on directory from the current one
    // path.join safely appends the two
    // const scholarshipsPath = path.join(__dirname, "../scholarships.json");
    // const studentsPath = path.join(__dirname, "../students-sample.json");

    // // 2. Read and Parse JSON
    // const scholarshipsData = JSON.parse(fs.readFileSync(scholarshipsPath, "utf-8"));
    // const studentsData = JSON.parse(fs.readFileSync(studentsPath, "utf-8"));

    const scholarshipsData = JSON.parse(fs.readFileSync("scholarships.json", "utf-8"));
    const studentsData = JSON.parse(fs.readFileSync("students-sample.json", "utf-8"));

    console.log("Extracting and Transforming Scholarship Data...");

    // 3. Process Scholarships
    for (const s of scholarshipsData.scholarships) {
        // await ensures each operation completes before moving to the next.. important for database consistency
        // upsert instead of create because if a record already exisits, it updates (does nothing here). Otherwise, it inserts
        await prisma.scholarship.upsert({
            where: {id: s.id},   // tells prisma to look for an existing record with this id. If found, it jumps to "update". If not found, it jumps to "create"
            update: {},  // don't do anything if it already exists
            create: {
                id: s.id,
                name: s.name,
                provider: s.provider,
                amount: s.amount,
                amount_type: s.amount_type,
                deadline: new Date(s.deadline),
                description: s.description,
                application_requirements: s.application_requirements,
                renewable: s.renewable,
                renewable_conditions: s.renewable_conditions,
                url: s.url,
                tags: s.tags,

                // Indexed Columns Extraction.. I will pull them out of the JSON and into columns
                min_gpa: s.eligibility.gpa_minimum || 0,
                requires_financial_need: s.eligibility.financial_need || false,
                citizenship: s.eligibility.citizenship || [],
                enrollment_status: s.eligibility.enrollment_status || [],

                // Non-Indexed Fields
                fields_of_study: s.fields_of_study || [],
                extra_eligibility: s.eligibility, // Store full object in JSONB for flexible logic

            }
        });
    }

    console.log("Database Seeding Successful!");
}   

main().catch((e) => {
    console.error("Seeding Error:", e);
    process.exit(1);
}).finally(async() => {
    await prisma.$disconnect();  // Closes database connection gracefully whether main() succeeds or fails. Prevents hanging connections
});