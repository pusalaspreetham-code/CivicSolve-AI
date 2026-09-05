import { Router } from "express";
import {
  previewCitizenProblem,
  confirmCitizenProblem,
  createCitizenProblem,
  getCitizenAiJobStatus,
  translateCitizenText,
  getCitizenCaseTracking,
} from "../controllers/citizenProblemController";
const router = Router();

router.post("/problems/preview", previewCitizenProblem);
router.post("/problems/confirm", confirmCitizenProblem);
router.post("/problems", createCitizenProblem);
router.get("/problems/jobs/:jobId",getCitizenAiJobStatus);
router.get("/cases/:reference", getCitizenCaseTracking);
router.post("/translate", translateCitizenText);

export default router;
