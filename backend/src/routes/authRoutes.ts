import { Router } from "express";
import { sendOtp, register, login, logout } from "../controllers/authController";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/send-otp", authLimiter, sendOtp);
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

export default router;
