import { Router } from "express";
import { sendUniversityOtp, registerUniversity, loginUniversity, logoutUniversity } from "../controllers/universityAuthController";
import { getMe, getDashboard, getUniversityStudents } from "../controllers/universityController";
import { requireUniversityAuth } from "../middleware/universityAuthMiddleware";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/auth/send-otp", authLimiter, sendUniversityOtp);
router.post("/auth/register", authLimiter, registerUniversity);
router.post("/auth/login", authLimiter, loginUniversity);
router.post("/auth/logout", logoutUniversity);

router.use(requireUniversityAuth);
router.get("/me", getMe);
router.get("/dashboard", getDashboard);
router.get("/students", getUniversityStudents);

export default router;
