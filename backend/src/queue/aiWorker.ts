import { Worker, Job } from "bullmq";
import {
  AI_QUEUE_NAME,
  AiJobData,
  redisConnection,
} from "./aiQueue";
import {
  previewIntake,
  processIntake,
} from "../services/aiPipelineClient";
import { NormalizedProblemIntake } from "../types/citizenProblem";
import { query } from "../config/database";

const concurrency = Number(
  process.env.AI_WORKER_CONCURRENCY || 1
);

async function processAiJob(job: Job<AiJobData>) {
  console.log(
    `[AI Worker] Processing job ${job.id} (${job.data.type})`
  );

  await job.updateProgress(10);

  try {
    const intake =
      job.data.payload as unknown as NormalizedProblemIntake;

    let result;

    if (job.data.type === "preview") {
      result = await previewIntake(intake);
    } else {
      result = await processIntake(intake);
    }

    if (job.data.type === "confirm" && result?.problemId) {
      await query(`UPDATE citizen_cases SET status = 'PROCESSED', problem_id = $1, updated_at = CURRENT_TIMESTAMP WHERE case_reference = $2`, [result.problemId, intake.metadata.intakeId]);
    }

    await job.updateProgress(100);

    console.log(
      `[AI Worker] Completed job ${job.id}`
    );

    return result;
  } catch (error) {
    console.error(
      `[AI Worker] Failed job ${job.id}:`,
      error
    );

    throw error;
  }
}

export function startAiWorker() {
  const worker = new Worker<AiJobData>(
    AI_QUEUE_NAME,
    processAiJob,
    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(
      `[AI Worker] Job ${job.id} completed successfully`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[AI Worker] Job ${job?.id} failed: ${error.message}`
    );
  });

  worker.on("error", (error) => {
    console.error(
      "[AI Worker] Worker error:",
      error
    );
  });

  console.log(
    `[AI Worker] Started with concurrency=${concurrency}`
  );

  return worker;
}