import { Router } from "express";
import { StudentController } from "./controllers/student-controller.js";
import { ScholarshipController } from "./controllers/scholarship-controller.js";

const router = Router();

// Student Endpoints
router.post("/students", StudentController.create);
router.get("/students/:id/matches", StudentController.getMatches);

// Scholarship Endpoints
router.get("/scholarships", ScholarshipController.getAll);

export default router;