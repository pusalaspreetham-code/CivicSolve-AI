export interface ProblemLocationDTO {
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ProblemDescriptionDTO {
  original: string;
  language: string;
  english: string;
}

export interface ProblemEvidenceDTO {
  type: 'image' | 'video' | string;
  name: string;
  url?: string;
  size?: number;
  previewUrl?: string;
  /** Optional base64-encoded file contents (data URL or raw base64), used for AI image analysis. */
  base64?: string;
}

/**
 * Result returned by the AI Classification & Deduplication microservice
 * (see /ai-pipeline) after it processes a citizen intake.
 */
export interface AiPipelineResult {
  ok: boolean;
  action: 'new_problem' | 'merged_existing' | 'skipped' | 'failed';
  problemId?: number;
  problemTitle?: string;
  problemDescription?: string;
  domain?: string;
  responsibleFields?: string[];
  severity?: string;
  confidence?: number;
  imageDescription?: string;
  matchedExistingId?: number;
  similarity?: number;
  reason?: string;
  error?: string;
}

export interface CitizenProblemIntakePayload {
  description: ProblemDescriptionDTO | string;
  location: ProblemLocationDTO;
  evidence?: ProblemEvidenceDTO[];
  metadata?: {
    submittedAt?: string;
    source?: string;
    clientLanguage?: string;
    previewId?: string;
    reviewedAiResult?: Partial<AiPipelineResult>;
  };
}

export interface NormalizedProblemIntake {
  description: ProblemDescriptionDTO;
  location: ProblemLocationDTO;
  evidence: ProblemEvidenceDTO[];
  metadata: {
    submittedAt: string;
    source: 'citizen';
    intakeId: string;
    clientLanguage?: string;
    previewId?: string;
    reviewedAiResult?: Partial<AiPipelineResult>;
  };
}

export interface ProblemIntakeReceipt {
  success: boolean;
  message: string;
  problemId: string;
  intakeId: string;
  status: 'RECEIVED';
  timestamp: string;
  payload: NormalizedProblemIntake;
  /** Populated once the AI Classification & Deduplication pipeline has run. */
  aiResult?: AiPipelineResult;
  jobId?: string;
}

// Legacy types retained for internal service safety
export interface CreateProblemDTO {
  title?: string;
  description: string;
  category?: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  evidence?: ProblemEvidenceDTO[];
  voice?: any;
}

export interface Problem {
  id: string;
  title?: string;
  description: string;
  category?: string;
  status: string;
  priority?: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  locationGeoJson?: any;
  evidence: any[];
  voice?: any;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  distanceMeters?: number;
}
