import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MatchingService } from './services/matching.service.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


//npx tsx src/test-matching.ts

async function test1() {
  // 1. Mock Maria Garcia (from the Guide)
  const maria: any = {
  "name": "Maria Garcia",
  "gpa": 3.6,
  "enrollment_status": "high_school_senior",
  "major": "Computer Science",
  "gender": "female",
  "ethnicity": ["Hispanic", "Latino"],
  "citizenship_status": "US Citizen",
  "household_income": 42000,
  "financial_need": true,
  "first_generation": true,
  "community_service_hours": 150,
  "state": "CA"
  };

  console.log(`\n👤 Student: Maria Garcia (GPA: ${maria.gpa}, Major: ${maria.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(maria);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 4)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test2() {
  // 1. Mock James Wilson (from the Guide)
  const james: any = {
      "gpa": 3.2,
      "enrollment_status": "undergraduate",
      "major": "Education",
      "graduation_year": 2027,
      "gender": "male",
      "ethnicity": ["African American"],
      "citizenship_status": "US Citizen",
      "household_income": 85000,
      "financial_need": false,
      "first_generation": false,
      "military_affiliation": "dependent",
      "residency": "suburban",
      "community_service_hours": 80,
      "state": "TX"
  };

  console.log(`\n👤 Student: James Wilson (GPA: ${james.gpa}, Major: ${james.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(james);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 2)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test3() {
  // 1. Mock Sarah Chen (from the Guide)
  const sarah: any = {
      "gpa": 3.9,
      "enrollment_status": "undergraduate",
      "major": "Nursing",
      "graduation_year": 2026,
      "gender": "female",
      "ethnicity": ["Asian"],
      "citizenship_status": "Permanent Resident",
      "household_income": 65000,
      "financial_need": false,
      "first_generation": false,
      "military_affiliation": null,
      "residency": "urban",
      "community_service_hours": 200,
      "state": "NY"
  };

  console.log(`\n👤 Student: Sarah Chen (GPA: ${sarah.gpa}, Major: ${sarah.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(sarah);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 2)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test4() {
  // 1. Mock Tyler Johnson (from the Guide)
  const tyler: any = {
      "gpa": 2.8,
      "enrollment_status": "high_school_senior",
      "major": "Business",
      "graduation_year": 2026,
      "gender": "male",
      "ethnicity": ["White"],
      "citizenship_status": "US Citizen",
      "household_income": 35000,
      "financial_need": true,
      "first_generation": true,
      "military_affiliation": null,
      "residency": "rural",
      "community_service_hours": 120,
      "state": "IA"
  };

  console.log(`\n👤 Student: Tyler Johnson (GPA: ${tyler.gpa}, Major: ${tyler.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(tyler);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 4)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test5() {
  // 1. Mock Priya Patel (from the Guide)
  const priya: any = {
      "gpa": 3.4,
      "enrollment_status": "undergraduate",
      "major": "Data Science",
      "graduation_year": 2025,
      "gender": "female",
      "ethnicity": ["Asian", "Indian"],
      "citizenship_status": "DACA",
      "household_income": 48000,
      "financial_need": true,
      "first_generation": false,
      "military_affiliation": null,
      "residency": "urban",
      "community_service_hours": 60,
      "state": "IL"
  };

  console.log(`\n👤 Student: Priya Patel (GPA: ${priya.gpa}, Major: ${priya.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(priya);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 1)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test6() {
  // 1. Mock nomatches (from the Guide)
  const nomatches: any = {
    "gpa": 1.8,
    "enrollment_status": "undergraduate",
    "major": "Philosophy",
    "citizenship_status": "International"
  };

  console.log(`\n👤 Student: nomatches (GPA: ${nomatches.gpa}, Major: ${nomatches.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(nomatches);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 0)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test7() {
  // 1. Mock allmatches (from the Guide)
  const allmatches: any = {
    "gpa": 4.0,
    "enrollment_status": "high_school_senior",
    "major": "Computer Science",
    "gender": "female",
    "first_generation": true,
    "financial_need": true,
    "community_service_hours": 200
  };

  console.log(`\n👤 Student: allmatches (GPA: ${allmatches.gpa}, Major: ${allmatches.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(allmatches);
  
  console.log(`✅ Found ${matches.length} matches (Expected: all)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}

async function test8() {
  // 1. Mock borderline (from the Guide)
  const borderline: any = {
    "gpa": 3.2,  // Exactly the minimum for Women in STEM
    "major": "Engineering",
    "gender": "female"
  };

  console.log(`\n👤 Student: borderline (GPA: ${borderline.gpa}, Major: ${borderline.major})`);
  console.log(`--------------------------------------------------`);
  const matches = await MatchingService.findMatches(borderline);
  
  console.log(`✅ Found ${matches.length} matches (Expected: 1)`);
  matches.forEach((m, index) => {
      console.log(`\n[${index + 1}] 🎓 ${m.scholarship.name}`);
      console.log(`    Provider: ${m.scholarship.provider}`);
      console.log(`    Amount: $${m.scholarship.amount}`);
      console.log(`    MATCH REASONS:`);
      m.reasons.forEach(r => console.log(`      • ${r}`));
    });
}


test1();