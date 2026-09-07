import { Router } from "express";
import { requireGovAuth } from "../middleware/govAuthMiddleware";
import {
  getGovMe,
  updateGovMe,
  changeGovPassword,
  getDashboardStats,
  getGovProblems,
  getGovProblemById,
  createGovAction,
  getGovProblemActions,
  getAiBrief
} from "../controllers/govController";

const router = Router();

router.use(requireGovAuth);

router.get("/me", getGovMe);
router.put("/me", updateGovMe);
router.put("/change-password", changeGovPassword);

router.get("/dashboard/stats", getDashboardStats);
router.get("/problems", getGovProblems);
router.get("/problems/:id", getGovProblemById);

router.post("/problems/:id/action", createGovAction);
router.get("/problems/:id/actions", getGovProblemActions);
router.get("/problems/:id/ai-brief", getAiBrief);

export default router;
