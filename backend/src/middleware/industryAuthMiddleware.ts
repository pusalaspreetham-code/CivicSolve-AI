import { Request, Response, NextFunction } from "express";
import { verifyIndustryToken } from "../utils/jwt";

export const requireIndustryAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyIndustryToken(token);
    req.industryId = payload.industryId;
    req.industryEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired session. Please log in again." });
  }
};
