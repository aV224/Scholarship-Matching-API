import 'dotenv/config'; // Load .env
import { AIService } from './services/ai-service.js';

// npx tsx src/test-ai.ts

const student: any = {
      "name": "James Wilson",
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

const scholarship: any = {
      "id": "sch_010",
      "name": "Veterans Family Scholarship",
      "provider": "Honor Our Heroes Foundation",
      "amount": 5000,
      "amount_type": "fixed",
      "deadline": new Date("2025-05-15"),
      "min_gpa": 2.0,                  
      "requires_financial_need": false, 
      "citizenship": ["US Citizen"],
      "fields_of_study": [],
      "enrollment_status": ["high_school_senior", "undergraduate"],
      "tags": ["military", "veterans", "family"],
      "extra_eligibility": {           // Service looks here (not "eligibility")
        "military_affiliation": ["veteran", "active_duty", "dependent"]
      }
      
}


async function testAI() {
  console.log('🤖 Testing AI Connection...');
  const explanation = await AIService.generateExplanation(student, scholarship);
  console.log('\nResult:');
  console.log(explanation);
}

testAI();