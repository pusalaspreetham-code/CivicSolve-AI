import {
  AiPipelineResult,
  NormalizedProblemIntake,
} from "../types/citizenProblem";

const AI_PIPELINE_URL =
  process.env.AI_PIPELINE_URL || "http://localhost:8001";

const AI_PIPELINE_TIMEOUT_MS = parseInt(
  process.env.AI_PIPELINE_TIMEOUT_MS || "120000",
  10
);

const AI_PREVIEW_TIMEOUT_MS = parseInt(
  process.env.AI_PREVIEW_TIMEOUT_MS || "120000",
  10
);

function extractFirstImageBase64(
  intake: NormalizedProblemIntake
): string | undefined {
  const imageItem = intake.evidence.find(
    (item) => item.type === "image" && item.base64
  );

  if (!imageItem?.base64) {
    return undefined;
  }

  const commaIdx = imageItem.base64.indexOf(",");

  if (imageItem.base64.startsWith("data:") && commaIdx !== -1) {
    return imageItem.base64.slice(commaIdx + 1);
  }

  return imageItem.base64;
}

class AiPipelineClient {
  private async request(
    path: string,
    body: Record<string, unknown>,
    timeoutMs: number
  ): Promise<AiPipelineResult> {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(
        `${AI_PIPELINE_URL}${path}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `AI service responded with ${response.status}${
            responseText
              ? `: ${responseText.slice(0, 300)}`
              : ""
          }`
        );
      }

      return JSON.parse(responseText) as AiPipelineResult;
    } finally {
      clearTimeout(timer);
    }
  }

  async previewIntake(
    intake: NormalizedProblemIntake
  ): Promise<AiPipelineResult> {
    const body = {
      mode: "analyze",

      intake_id:
        intake.metadata.intakeId ||
        intake.metadata.previewId ||
        "preview",

      text:
        intake.description.english ||
        intake.description.original,

      original_text: intake.description.original,

      latitude: intake.location.latitude,
      longitude: intake.location.longitude,

      image_base64:
        extractFirstImageBase64(intake),
    };

    const result = await this.request(
      "/preview",
      body,
      AI_PREVIEW_TIMEOUT_MS
    );

    return {
      ...result,
      ok: true,
    };
  }

  async processIntake(
    intake: NormalizedProblemIntake
  ): Promise<AiPipelineResult> {
    const reviewed =
      intake.metadata.reviewedAiResult;

    const body = {
      mode: "confirm",

      intake_id:
        intake.metadata.intakeId ||
        intake.metadata.previewId ||
        "confirmed",

      text:
        intake.description.english ||
        intake.description.original,

      original_text: intake.description.original,

      latitude: intake.location.latitude,
      longitude: intake.location.longitude,

      image_base64:
        extractFirstImageBase64(intake),

      image_description:
        reviewed?.imageDescription || undefined,
      case_reference: intake.metadata.intakeId || undefined,

      problem_title:
        reviewed?.problemTitle,

      problem_description:
        reviewed?.problemDescription,

      domain:
        reviewed?.domain,

      responsible_fields:
        reviewed?.responsibleFields,

      severity:
        reviewed?.severity,

      confidence:
        reviewed?.confidence,
    };

    const result = await this.request(
      "/process",
      body,
      AI_PIPELINE_TIMEOUT_MS
    );

    return {
      ...result,
      ok: true,
    };
  }
}

export const aiPipelineClient =
  new AiPipelineClient();

export async function previewIntake(
  intake: NormalizedProblemIntake
): Promise<AiPipelineResult> {
  return aiPipelineClient.previewIntake(intake);
}

export async function processIntake(
  intake: NormalizedProblemIntake
): Promise<AiPipelineResult> {
  return aiPipelineClient.processIntake(intake);
}