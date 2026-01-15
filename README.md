# TuitionPlanner Scholarship Matching API

A robust, high-performance REST API designed to match students with scholarships based on complex eligibility criteria. This project features a two-stage filtering engine, pragmatic database indexing, and a resilient AI integration for personalized match explanations.

---

## 🛠️ Tech Stack

-   **Runtime:** Node.js
-   **Language:** TypeScript (Strict Mode)
-   **Framework:** Express.js
-   **Database:** PostgreSQL
-   **ORM:** Prisma
-   **Validation:** Zod
-   **AI Inference:** HuggingFace (DeepSeek-R1 / Zephyr-7b)

---

## 🚀 Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   PostgreSQL
*   A HuggingFace API Token (Free tier is sufficient)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/tuition_planner"
HUGGINGFACE_TOKEN="hf_your_token_here"
```

### 4. Database Initialization
This project uses Prisma Migrations. Run the following to set up the schema and seed the scholarship data:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Running the Server
Start the development server:
```bash
npm run dev
```
*Server will start on `http://localhost:3000`*

---

## 📡 API Usage

### 1. Create a Student Profile
**Note:** Please provide *at least* the following fields: `name`, `email`, `gpa`, `major`, `enrollment_status`, `citizenship_status`, `graduation_year`, `household_income`, and `state`. While the system handles optional data, the matching engine relies on these core attributes to function correctly.

```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "gpa": 3.8,
    "major": "Computer Science",
    "enrollment_status": "undergraduate",
    "citizenship_status": "US Citizen",
    "graduation_year": 2026,
    "household_income": 45000,
    "state": "CA"
  }'
```

### 2. Get Matches for a Student
Returns matched scholarships with AI-generated explanations.
*(Recommended: Install `jq` for pretty-printing: `sudo apt install jq`)*

```bash
# Replace :id with the ID returned from the POST request (e.g., stu_006)
curl http://localhost:3000/api/students/stu_006/matches | jq
```

### 3. List All Scholarships
```bash
curl http://localhost:3000/api/scholarships | jq
```

---

## 🏗️ Architecture & Design Decisions

### 1. Database & Pragmatic Indexing
**Why PostgreSQL & Prisma?**
Relational integrity was crucial for the structured nature of scholarship data. Prisma was chosen for its type-safe query building and easy migration management.

**Indexing Strategy:**
Instead of indexing every column, I employed a **Pragmatic Indexing Strategy**.
*   **The Problem:** The database is Read-Heavy (many searches, few updates). Essentially, having many indexes on a Write-Heavy database would be inefficient since the indexing would have to be redone every time. With a Read-Heavy database such as Scholarships that gets updated perhaps once a day, it's optimal. 
*   **The Solution:** I traded write performance for read speed by indexing only the 4 "Gatekeeper" fields: **GPA**, **Citizenship**, **Enrollment Status**, and **Financial Need**.
*   **Why 4?** In a scholarship database of thousands, these filters would disqualify most of the non-matches immediately. This prevents the database from performing expensive full-table scans.

### 2. Two-Stage Matching Engine
I implemented a high-performance filtering pipeline:
1.  **Stage 1 (Database Filter):** Uses the Indexed Gatekeepers to narrow 10,000+ scholarships down to ~50 candidates in milliseconds using database-level logic (`lte`, `has`, `hasSome`).
2.  **Stage 2 (Precision Filter):** Performs complex, CPU-heavy checks in-memory (TypeScript) on the reduced dataset. This handles messy logic like "Nursing is STEM" exceptions, specific Major lists, and JSON-based eligibility rules.

### 3. Domain Logic Assumptions
*   **Financial Need:** Calculated automatically if `household_income < $50,000` OR if explicitly flagged `true`.
*   **STEM Definition:** Nursing is treated as a STEM major because it requires reasoning, experimenting, and experience with Science.
*   **Forward Eligibility:** High School Seniors are treated as prospective Undergraduates, allowing them to match scholarships for their *future* status.

---

## 🔍 Matching Logic Analysis

During development and testing, I noticed my engine returned more matches than the provided Guide. Upon analyzing the results and the data values carefully, I found that these are **valid data matches** based on the provided eligibility requirements of the scholarships. 

| Student | Expected | Actual | Analysis of "Extra" Matches |
| :--- | :--- | :--- | :--- |
| **Maria Garcia** | 4 | **6** | **Entrepreneurship Award:** Maria matches all of the requirements, with them being GPA (above 2.75), major (CS), citizenship (US Citizen), enrollment status (senior and can be treated as undergraduate), and doesn't need financial need.<br>**Overcoming Adversity:** Maria meets the gpa minimum, citizenship req, enrollment status, and financial need |
| **Sarah Chen** | 2 | **3** | **Environmental Stewardship:** Sarah matched because she met the major requirement through Nursing being counted as Nursing, just as it was with Women in STEM. She also met the gpa req, citizenship, and enrollment. |
| **Tyler Johnson** | 4 | **5** | **Entrepreneurship Award:** Tyler matched with this because his major (Business) qualified, gpa, citizenship, and enrollment. |
| **Priya Patel** | 1 | **2** | **Overcoming Adversity:** Priya matched with this because she met gpa, citizenship, enrollment, and she demonstrated the need for financial aid. |

---

## 🤖 AI Integration (Bonus Implementation)

I integrated a real LLM (DeepSeek-R1 via HuggingFace) to generate personalized explanations.

### 1. Prompt Engineering & Context Filtering
Initially, feeding the entire student profile to the AI led to hallucinations (e.g., mentioning gender for generic scholarships).
*   **The Fix:** I implemented **Context-Aware Prompting**. The code analyzes the scholarship's specific requirements (e.g., does it require a specific major? does it require financial need?) and *only* injects those relevant student attributes into the prompt.
*   **Result:** The AI generates precise explanations that only reference factors explicitly required by the scholarship.

### 2. Resilience & Error Handling
I implemented a production-grade wrapper around the API:
*   **Exponential Backoff:** If the API returns `503` (Model Loading) or `429` (Rate Limit), the system retries with increasing delays (1s, 2s, 4s).
*   **Graceful Fallback:** If the AI fails completely, a robust template generator takes over so the API never crashes.
*   **Caching:** Successful AI responses are cached in-memory to reduce latency and API costs.

---

## 🧪 Testing Strategy

I adopted a Test-Driven Development (TDD) approach, creating standalone test scripts to verify logic before API integration.

### Unit Tests
*   `src/test-matching.ts`: Runs the 5 sample students against the matching logic and prints detailed "Match Reasons" to the console. This allowed me to debug the "Maria Garcia" edge cases.
*   `src/test-ai.ts`: Verifies the AI connection, retry logic, whether the prompt generated accurately/completely describes the match reasons, and validates that the prompt builder is correctly filtering context.

**To Run Tests:**
```bash
npx tsx src/test-matching.ts
npx tsx src/test-ai.ts
```

---

## ⏱️ Time Breakdown

| Task | Time | Notes |
| :--- | :--- | :--- |
| **Database Design** | 1.5h | Schema setup, Indexing strategy, Seeding logic |
| **API Implementation** | 3.5h | Controllers, Zod validation, Routing |
| **AI Integration** | 1.0h | Prompt engineering, Context filtering, Resilience logic |
| **Testing & Refinement** | 1.0h | Unit tests, Edge case handling (Nursing/STEM, High School Senior logic) |
| **Total** | **7.0h** | |

---

## 🔮 Future Improvements

*   **Enhanced Zod Validation:** Currently, missing required fields throw a generic error. I would improve this to provide specific messages like "GPA is required" to the user. Essentially, I'd like to make it clearer to the user and directly ask them to provide the rest of the missing values. 
*   **Pagination:** Implementation of cursor-based pagination for the `/scholarships` endpoint.
*   **Rate Limiting:** Adding middleware to prevent API abuse.

---
<div align="center">

## Thank You!

Aarya Vijayaraghavan

</div>
