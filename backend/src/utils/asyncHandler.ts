import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async controller functions so thrown errors reach errorMiddleware
// instead of crashing the process.
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
