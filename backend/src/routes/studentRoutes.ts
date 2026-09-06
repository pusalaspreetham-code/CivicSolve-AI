import { Router } from "express";
import { getMe, updateMe, changePassword } from "../controllers/studentController";
import { getMyProblems, updateMyProblemStatus, removeMyProblem } from "../controllers/problemController";
import { listFacultyForStudent, requestFacultyGuidance, getMyGuidanceRequests } from "../controllers/facultyGuidanceController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);
router.put("/change-password", changePassword);

router.get("/my-problems", getMyProblems);
router.patch("/my-problems/:id", updateMyProblemStatus);
router.delete("/my-problems/:id", removeMyProblem);

// Work With Faculty (optional) — student side
router.get("/faculty", listFacultyForStudent);
router.post("/faculty/guidance-requests", requestFacultyGuidance);
router.get("/faculty/guidance-requests", getMyGuidanceRequests);

export default router;
