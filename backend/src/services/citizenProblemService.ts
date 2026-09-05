import { Job } from "bullmq";
import { query } from "../config/database";
import { aiQueue } from "../queue/aiQueue";
import {
  AiPipelineResult,
  NormalizedProblemIntake,
  ProblemIntakeReceipt,
} from "../types/citizenProblem";

class CitizenProblemService {
  private generateIntakeId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `CS-${year}-${random}`;
  }

  private generatePreviewId(): string {
    return `PREVIEW-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }

  async previewProblem(
    data: NormalizedProblemIntake
  ): Promise<{
    previewId: string;
    jobId: string;
  }> {
    const previewId = this.generatePreviewId();

    data.metadata.previewId = previewId;

    const job = await aiQueue.add("preview", {
      type: "preview",
      intakeId: previewId,
      payload: data as unknown as Record<string, unknown>,
    });

    return {
      previewId,
      jobId: String(job.id),
    };
  }

  async intakeProblem(
    data: NormalizedProblemIntake
  ): Promise<ProblemIntakeReceipt> {
    const intakeId = this.generateIntakeId();
    const timestamp = new Date().toISOString();

    data.metadata.intakeId = intakeId;
    await query(`INSERT INTO citizen_cases (case_reference, status) VALUES ($1, 'RECEIVED') ON CONFLICT (case_reference) DO NOTHING`, [intakeId]);
    const job = await aiQueue.add("confirm", {
      type: "confirm",
      intakeId,
      payload: data as unknown as Record<string, unknown>,
    });

    return {
      success: true,
      message:
        "Citizen problem received and queued for AI processing.",
      problemId: intakeId,
      intakeId,
      status: "RECEIVED",
      timestamp,
      payload: data,
      jobId: String(job.id),
    };
  }

  async getJobStatus(jobId: string): Promise<{
    jobId: string;
    state: string;
    progress: number;
    result?: AiPipelineResult;
    error?: string;
  }> {
    const job = await Job.fromId(aiQueue, jobId);

    if (!job) {
      throw new Error(`AI job ${jobId} was not found.`);
    }

    const state = await job.getState();

    let progress = 0;

    if (typeof job.progress === "number") {
      progress = job.progress;
    } else if (job.progress === true) {
      progress = 100;
    }

    return {
      jobId: String(job.id),
      state,
      progress,
      result: job.returnvalue as
        | AiPipelineResult
        | undefined,
      error: job.failedReason || undefined,
    };
  }
}

export const problemService =
  new CitizenProblemService();