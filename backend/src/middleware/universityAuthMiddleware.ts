import { Request, Response, NextFunction } from "express";
import { verifyUniversityToken } from "../utils/jwt";

export const requireUniversityAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyUniversityToken(token);
    req.universityId = payload.universityId;
    req.universityEmail = payload.email;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired session. Please log in again." });
  }
};
