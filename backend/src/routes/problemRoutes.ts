import { Router } from "express";
import {
  getRelevantProblems,
  getProblemById,
  getProblemsForMap,
  joinProblem,
  getProblemTracking,
  searchProblems,
} from "../controllers/problemController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/relevant", getRelevantProblems);
router.get("/map", getProblemsForMap);
router.get("/search", searchProblems);
router.get("/:id/tracking", getProblemTracking);
router.get("/:id", getProblemById);
router.post("/:id/join", joinProblem);

export default router;
