import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found." });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
};
