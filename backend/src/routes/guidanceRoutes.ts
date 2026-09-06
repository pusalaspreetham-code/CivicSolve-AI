import { Router } from "express";
import { respondToGuidanceRequest } from "../controllers/facultyGuidanceController";

const router = Router();

// Public — faculty click this straight from their email. No login.
router.get("/respond", respondToGuidanceRequest);

export default router;
