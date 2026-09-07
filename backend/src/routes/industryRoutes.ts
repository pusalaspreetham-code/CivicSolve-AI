import { Router } from "express";
import {
  sendIndustryOtp,
  registerIndustry,
  loginIndustry,
  logoutIndustry,
} from "../controllers/industryAuthController";
import {
  getMe,
  getDashboard,
  getIndustryProblems,
  getProblemDetails,
  adoptProblem,
  getMyAdoptions,
  updateAdoptionStatus,
  submitSolutionReview,
} from "../controllers/industryController";
import {
  listIndustryConversations,
  getIndustryTeamMessages,
  sendIndustryTeamMessage,
} from "../controllers/industryMessagingController";
import { requireIndustryAuth } from "../middleware/industryAuthMiddleware";
import { authLimiter, messageLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public auth routes
router.post("/auth/send-otp", authLimiter, sendIndustryOtp);
router.post("/auth/register", authLimiter, registerIndustry);
router.post("/auth/login", authLimiter, loginIndustry);
router.post("/auth/logout", logoutIndustry);

// Protected routes
router.use(requireIndustryAuth);

router.get("/me", getMe);
router.get("/dashboard", getDashboard);
router.get("/problems", getIndustryProblems);
router.get("/problems/:id", getProblemDetails);
router.post("/problems/:id/adopt", adoptProblem);
router.get("/adoptions", getMyAdoptions);
router.patch("/adoptions/:id", updateAdoptionStatus);
router.post("/solutions/:studentProblemId/review", submitSolutionReview);

// Messaging with student teams working on adopted problems
router.get("/messages", listIndustryConversations);
router.get("/messages/:teamId", getIndustryTeamMessages);
router.post("/messages/:teamId", messageLimiter, sendIndustryTeamMessage);

export default router;
