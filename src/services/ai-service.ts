import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import type { Scholarship, Student } from '@prisma/client';
import OpenAI from 'openai'; 

export class AIService {
  private static cache = new Map<string, string>();
  
  // Using the client/model you set up
  private static readonly CLIENT = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN, // Handle both names just in case
  });
  
  private static readonly MODEL_NAME = "deepseek-ai/DeepSeek-R1"; 

  static async generateExplanation(student: Student, scholarship: Scholarship): Promise<string> {
    const cacheKey = `${student.id}-${scholarship.id}`;
    if (this.cache.has(cacheKey)) {
      console.log(`⚡ Serving explanation from cache for ${scholarship.id}`);
      return this.cache.get(cacheKey)!;
    }

    const { systemMessage, userMessage } = this.buildPromptMessages(student, scholarship);

    try {
      const explanation = await this.fetchWithRetry(systemMessage, userMessage);
      this.cache.set(cacheKey, explanation);
      return explanation;
    } catch (error) {
      console.error("⚠️ AI Service Failed, using fallback:", error);
      return this.getFallbackExplanation(student, scholarship);
    }
  }

  private static async fetchWithRetry(systemPrompt: string, userPrompt: string, retries = 3, delay = 1000): Promise<string> {
    try {
      const completion = await this.CLIENT.chat.completions.create({
        model: this.MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500, 
        temperature: 0.6, 
      });

      const messageContent = completion.choices[0]?.message?.content;

      if (messageContent) {
        // Clean up <think> tags from DeepSeek R1
        let cleanText = messageContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        cleanText = cleanText.replace(/^"|"$/g, '');
        return cleanText;
      }

      throw new Error('Empty response from AI');

    } catch (error: any) {
      const isModelLoading = error?.status === 503 || error?.code === 503;
      
      if (retries > 0) {
        if (isModelLoading) {
            console.log(`⏳ Model is loading, waiting ${delay}ms...`);
        } else {
            console.log(`⏳ AI Busy (${error.message}), retrying in ${delay}ms...`);
        }
        await new Promise(res => setTimeout(res, delay));
        return this.fetchWithRetry(systemPrompt, userPrompt, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  private static getFallbackExplanation(student: Student, scholarship: Scholarship): string {
    return `The ${scholarship.name} is a great match for you based on your ${student.gpa} GPA and ${student.major} major. This $${scholarship.amount.toLocaleString()} award could support your educational goals.`;
  }

  private static buildPromptMessages(student: Student, scholarship: Scholarship): { systemMessage: string, userMessage: string } {
    const extra = (scholarship.extra_eligibility as any) || {}; 
    
    const fieldsOfStudy = scholarship.fields_of_study || [];
    const tags = scholarship.tags || [];

    const relevantFactors: string[] = [];

    relevantFactors.push(`Student GPA: ${student.gpa} (Minimum Required: ${scholarship.min_gpa ?? 'None'})`);

    // Only mention if scholarship has a specific list (not open to all)
    if (scholarship.citizenship && scholarship.citizenship.length > 0) {
      relevantFactors.push(`Citizenship: ${student.citizenship_status} (Matches eligible list: ${scholarship.citizenship.join(', ')})`);
    }

    if (scholarship.enrollment_status && scholarship.enrollment_status.length > 0) {
      relevantFactors.push(`Enrollment Status: ${student.enrollment_status} (Matches eligible list: ${scholarship.enrollment_status.join(', ')})`);
    }

    // If scholarship has specific majors OR is a STEM scholarship
    if (fieldsOfStudy.length > 0 || tags.includes('STEM')) {
      relevantFactors.push(`Student Major: ${student.major}`);
      if (fieldsOfStudy.length > 0) {
        relevantFactors.push(`Eligible Majors: ${fieldsOfStudy.join(', ')}`);
      }
    }

    // Financial Need
    if (scholarship.requires_financial_need) {
      relevantFactors.push(`Financial Need: Demonstrated (Household Income $${student.household_income})`);
    }

    // First Generation
    if (extra.first_generation) {
      relevantFactors.push(`First Generation Status: Yes`);
    }

    // Gender
    if (extra.gender) {
      relevantFactors.push(`Gender: ${student.gender} (Matches requirement: ${extra.gender})`);
    }

    // Ethnicity
    if (extra.ethnicity && extra.ethnicity.length > 0) {
      relevantFactors.push(`Ethnicity: ${student.ethnicity.join(', ')} (Matches requirement: ${extra.ethnicity.join(', ')})`);
    }

    // Residency
    if (extra.residency) {
      relevantFactors.push(`Residency: ${student.residency} (Matches requirement: ${extra.residency})`);
    }

    // Military
    if (extra.military_affiliation) {
      relevantFactors.push(`Military Affiliation: ${student.military_affiliation} (Matches requirement)`);
    }

    // Community Service
    if (extra.community_service_hours) {
      relevantFactors.push(`Community Service: ${student.community_service_hours} hours (Minimum: ${extra.community_service_hours})`);
    }

    // Debugging: Uncomment to see exactly what is being sent to AI
    // console.log("AI Input Factors:", relevantFactors);

    const systemMessage = `You are an expert scholarship advisor.
    Task: Write a 2-3 sentence personalized explanation for why the student matches the scholarship.
    
    CRITICAL INSTRUCTIONS:
    - Base your explanation ONLY on the provided matching factors.
    - Do NOT mention attributes that are not listed.
    - Mention the award amount.
    - Be encouraging and specific.
    - Do NOT output your internal chain of thought, just the final explanation.`;

    const userMessage = `
    Student Name: ${student.name}
    Scholarship Name: ${scholarship.name}
    Award Amount: $${scholarship.amount.toLocaleString()}

    MATCHING FACTORS:
    ${relevantFactors.map(f => `- ${f}`).join('\n')}

    Write ONLY the explanation.`;

    return { systemMessage, userMessage };
  }
}