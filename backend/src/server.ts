import app from "./app";
import { testConnection } from "./config/database";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`CivicSolve Student Portal API listening on http://localhost:${PORT}`);
  });
};

start();
