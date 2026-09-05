import dotenv from "dotenv";
import { startAiWorker } from "./aiWorker";

dotenv.config();

startAiWorker();

console.log(
  "CivicSolve AI worker process is running."
);