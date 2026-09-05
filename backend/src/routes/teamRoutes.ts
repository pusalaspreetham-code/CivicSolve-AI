import { Router } from "express";
import { createTeam, joinTeam, getMyTeams, getTeamsForProblem, leaveTeam } from "../controllers/teamController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.post("/", createTeam);
router.post("/join", joinTeam);
router.get("/mine", getMyTeams);
router.get("/problem/:problemId", getTeamsForProblem);
router.delete("/:id/leave", leaveTeam);

export default router;
