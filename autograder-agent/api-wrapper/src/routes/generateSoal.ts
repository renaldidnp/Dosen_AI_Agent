import { Router } from "express";
import { handleGenerateSoalRequest } from "../controllers/generateSoalController";

const router = Router();

router.post("/generate-soal", handleGenerateSoalRequest);

export default router;
