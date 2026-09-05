import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT || 6379);

export const redisConnection = new IORedis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

export const AI_QUEUE_NAME = "civicsolve-ai";

export interface AiJobData {
  type: "preview" | "confirm";
  intakeId: string;
  payload: Record<string, unknown>;
}

export const aiQueue = new Queue<AiJobData>(AI_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: 500,
    removeOnFail: 500,
  },
});