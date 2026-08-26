import { Router } from "express";
import { handleGradeRequest } from "../controllers/gradeController";

const router = Router();

router.post("/grade", handleGradeRequest);

export default router;
