import { Router } from "express";
import {
  createTeam,
  joinTeam,
  getMyTeams,
  getTeamsForProblem,
  leaveTeam,
  getTeamSolution,
  upsertTeamSolution,
} from "../controllers/teamController";
import {
  listTeamIndustryConversations,
  getTeamIndustryMessages,
  sendTeamIndustryMessage,
} from "../controllers/teamMessagingController";
import { requireAuth } from "../middleware/authMiddleware";
import { messageLimiter } from "../middleware/rateLimiter";

const router = Router();

router.use(requireAuth);

router.post("/", createTeam);
router.post("/join", joinTeam);
router.get("/mine", getMyTeams);
router.get("/problem/:problemId", getTeamsForProblem);
router.delete("/:id/leave", leaveTeam);

router.get("/:id/solution", getTeamSolution);
router.put("/:id/solution", upsertTeamSolution);

// Messaging with industries that adopted this team's problem
router.get("/:teamId/industry-conversations", listTeamIndustryConversations);
router.get("/:teamId/industry-conversations/:industryId", getTeamIndustryMessages);
router.post("/:teamId/industry-conversations/:industryId", messageLimiter, sendTeamIndustryMessage);

export default router;
