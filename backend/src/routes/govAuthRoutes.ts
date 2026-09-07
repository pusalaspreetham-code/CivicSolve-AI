import { Router } from "express";
import { sendGovOtp, registerGov, loginGov, logoutGov, forgotPassword, resetPassword } from "../controllers/govAuthController";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: "Too many requests, please try again later." }
});

router.post("/send-otp", authLimiter, sendGovOtp);
router.post("/register", authLimiter, registerGov);
router.post("/login", authLimiter, loginGov);
router.post("/logout", logoutGov);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;
