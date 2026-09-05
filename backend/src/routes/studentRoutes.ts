import { Router } from "express";
import { getMe, updateMe, changePassword } from "../controllers/studentController";
import { getMyProblems, updateMyProblemStatus, removeMyProblem } from "../controllers/problemController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);

router.get("/me", getMe);
router.put("/me", updateMe);
router.put("/change-password", changePassword);

router.get("/my-problems", getMyProblems);
router.patch("/my-problems/:id", updateMyProblemStatus);
router.delete("/my-problems/:id", removeMyProblem);

export default router;
