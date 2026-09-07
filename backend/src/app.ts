import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes";
import studentRoutes from "./routes/studentRoutes";
import problemRoutes from "./routes/problemRoutes";
import citizenRoutes from "./routes/citizenRoutes";
import universityRoutes from "./routes/universityRoutes";
import teamRoutes from "./routes/teamRoutes";
import guidanceRoutes from "./routes/guidanceRoutes";
import govAuthRoutes from "./routes/govAuthRoutes";
import govRoutes from "./routes/govRoutes";
import industryRoutes from "./routes/industryRoutes";
import adminRoutes from "./routes/adminRoutes";
import { getPublicProblems } from "./controllers/problemController";
import { notFound, errorHandler } from "./middleware/errorMiddleware";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.CLIENT_URL,
    ].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "CivicSolve Student Portal API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.get("/api/public/problems", getPublicProblems);
app.use("/api/problems", problemRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/university", universityRoutes);
app.use("/api/teams", teamRoutes);
// Public — faculty accept/deny guidance links from email (no auth).
app.use("/api/guidance", guidanceRoutes);
app.use("/api/gov/auth", govAuthRoutes);
app.use("/api/gov", govRoutes);
app.use("/api/industry", industryRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
