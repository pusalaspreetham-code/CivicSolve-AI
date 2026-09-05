import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { query } from "../config/database";
import { AppError } from "../utils/AppError";
import { problemService } from "../services/citizenProblemService";
import { translationService } from "../services/citizenTranslationService";

import {
  CitizenProblemIntakePayload,
  NormalizedProblemIntake,
  ProblemDescriptionDTO,
} from "../types/citizenProblem";

const normalizeCitizenIntake = async (
  body: CitizenProblemIntakePayload
): Promise<NormalizedProblemIntake> => {
  const {
    description,
    location,
    evidence,
    metadata,
  } = body;

  const errors: string[] = [];

  let originalText = "";
  let languageCode = "en";
  let englishText = "";

  if (!description) {
    errors.push('Field "description" is required.');
  } else if (typeof description === "string") {
    originalText = description.trim();

    languageCode =
      metadata?.clientLanguage || "en";

    englishText =
      languageCode.toLowerCase() === "en"
        ? originalText
        : "";
  } else if (typeof description === "object") {
    originalText =
      (description.original || "").trim();

    languageCode =
      (
        description.language ||
        metadata?.clientLanguage ||
        "en"
      ).trim();

    englishText =
      (description.english || "").trim();
  } else {
    errors.push(
      'Field "description" must be an object or string.'
    );
  }

  if (!originalText) {
    errors.push(
      'Field "description" cannot be empty.'
    );
  } else if (originalText.length < 15) {
    errors.push(
      'Field "description" must be at least 15 characters long.'
    );
  }

  const address =
    (location?.address || "").trim();

  const latitude = location?.latitude;
  const longitude = location?.longitude;

  if (!address) {
    errors.push(
      'Field "location.address" is required.'
    );
  }

  if (
    latitude !== null &&
    latitude !== undefined &&
    typeof latitude !== "number"
  ) {
    errors.push(
      'Field "location.latitude" must be a number or null.'
    );
  }

  if (
    longitude !== null &&
    longitude !== undefined &&
    typeof longitude !== "number"
  ) {
    errors.push(
      'Field "location.longitude" must be a number or null.'
    );
  }

  if (errors.length) {
    throw new AppError(
      `Citizen intake validation failed: ${errors.join(
        " "
      )}`,
      400
    );
  }

  if (!englishText) {
    if (languageCode.toLowerCase() === "en") {
      englishText = originalText;
    } else {
      const translated =
        await translationService.translateToEnglish(
          originalText,
          languageCode
        );

      englishText = translated.success
        ? translated.englishText
        : originalText;
    }
  }

  const normalizedDescription: ProblemDescriptionDTO = {
    original: originalText,
    language: languageCode,
    english: englishText,
  };

  const normalizedEvidence = Array.isArray(
    evidence
  )
    ? evidence.map((item) => ({
        type: item.type || "image",
        name:
          item.name || "evidence-file",
        url:
          item.url ||
          item.previewUrl ||
          "",
        size: item.size,
        previewUrl:
          item.previewUrl ||
          item.url,
        base64: item.base64,
      }))
    : [];

  return {
    description: normalizedDescription,

    location: {
      address,
      latitude:
        typeof latitude === "number"
          ? latitude
          : null,
      longitude:
        typeof longitude === "number"
          ? longitude
          : null,
    },

    evidence: normalizedEvidence,

    metadata: {
      submittedAt:
        metadata?.submittedAt ||
        new Date().toISOString(),

      source: "citizen",

      intakeId: "",

      clientLanguage:
        languageCode,

      previewId:
        metadata?.previewId,

      reviewedAiResult:
        metadata?.reviewedAiResult,
    },
  };
};

export const previewCitizenProblem =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const intake =
        await normalizeCitizenIntake(
          req.body as CitizenProblemIntakePayload
        );

      const preview =
        await problemService.previewProblem(
          intake
        );

      res.status(202).json({
        success: true,
        previewId:
          preview.previewId,
        jobId: preview.jobId,
        payload: intake,
        status: "QUEUED",
        message:
          "Problem submitted for AI preview processing.",
        expiresInSeconds: 900,
      });
    }
  );

export const confirmCitizenProblem =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const intake =
        await normalizeCitizenIntake(
          req.body as CitizenProblemIntakePayload
        );

      const receipt =
        await problemService.intakeProblem(
          intake
        );

      res.status(202).json(receipt);
    }
  );

export const createCitizenProblem =
  confirmCitizenProblem;

export const getCitizenAiJobStatus =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const { jobId } = req.params;

      if (!jobId) {
        throw new AppError(
          "Job ID is required.",
          400
        );
      }

      const status =
        await problemService.getJobStatus(
          jobId
        );

      res.status(200).json({
        success: true,
        ...status,
      });
    }
  );

export const translateCitizenText =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const {
        text,
        sourceLanguage,
      } = req.body as {
        text?: string;
        sourceLanguage?: string;
      };

      if (
        !text ||
        typeof text !== "string"
      ) {
        throw new AppError(
          'Field "text" is required and must be a string.',
          400
        );
      }

      const result =
        await translationService.translateToEnglish(
          text,
          typeof sourceLanguage === "string"
            ? sourceLanguage
            : "en"
        );

      res.json(result);
    }
  );
export const getCitizenCaseTracking = asyncHandler(
  async (req: Request, res: Response) => {
    const reference = String(req.params.reference || "")
      .trim()
      .toUpperCase();

    if (!reference) {
      throw new AppError("Case reference is required.", 400);
    }

    const { rows } = await query(
      `
      SELECT
        c.case_reference,
        c.status AS status,
        c.created_at,
        c.problem_id,
        r.problem_title,
        r.problem_description,
        r.domain,
        r.severity,
        r.responsible_fields,

        COALESCE(
          (
            SELECT COUNT(*)
            FROM problem_reports x
            WHERE x.problem_id = c.problem_id
          ),
          0
        )::int AS report_count,

        COALESCE(
          (
            SELECT COUNT(*)
            FROM student_problems sp
            WHERE sp.problem_id = c.problem_id
              AND sp.status IN ('INTERESTED', 'WORKING')
          ),
          0
        )::int AS students_solving,

        COALESCE(
          (
            SELECT COUNT(*)
            FROM student_problems sp
            WHERE sp.problem_id = c.problem_id
              AND sp.status = 'COMPLETED'
          ),
          0
        )::int AS students_completed

      FROM citizen_cases c
      LEFT JOIN reports r
        ON r.id = c.problem_id

      WHERE UPPER(c.case_reference) = $1
      LIMIT 1
      `,
      [reference]
    );

    if (!rows.length) {
      throw new AppError(
        "Case reference not found.",
        404
      );
    }

    return res.json({
      success: true,
      case: rows[0],
    });
  }
);