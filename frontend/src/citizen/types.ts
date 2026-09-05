export interface EvidenceItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: 'image' | 'video' | string;
  previewUrl: string;
  url?: string;
  uploadedAt: string;
}

export interface ProblemLocation {
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export interface ProblemDescription {
  original: string;
  language: string;
  english: string;
}

export interface ProblemFormData {
  description: string;
  language: string;
  location: ProblemLocation;
  evidence: EvidenceItem[];
}

export interface FormErrors {
  description?: string;
  address?: string;
  general?: string;
}

export type SubmissionStepState =
  | 'idle'
  | 'editing'
  | 'translating'
  | 'analyzing'
  | 'preview' // ready to submit
  | 'submitting'
  | 'success'
  | 'error';

/**
 * Standard structured AI Handoff payload sent to POST /api/citizen/problems
 */
export interface CitizenProblemPayload {
  description: {
    original: string;
    language: string;
    english: string;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
    address: string;
  };
  evidence: Array<{
    type: 'image' | 'video' | string;
    name: string;
    url?: string;
    size?: number;
    previewUrl?: string;
    /** Base64-encoded contents of the first image, used server-side for AI image analysis. */
    base64?: string;
  }>;
  metadata: {
    submittedAt: string;
    source: 'citizen';
    clientLanguage?: string;
    previewId?: string;
    reviewedAiResult?: Partial<AiPipelineResult>;
  };
}

/**
 * Official receipt returned from POST /api/citizen/problems
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

export interface ProblemIntakeReceipt {
  success: boolean;
  message: string;
  problemId: string;
  intakeId: string;
  status: 'RECEIVED';
  timestamp: string;
  payload: CitizenProblemPayload;
  aiResult?: AiPipelineResult;
}

// Backwards compatibility alias for components
export type SubmissionPayload = ProblemIntakeReceipt;
