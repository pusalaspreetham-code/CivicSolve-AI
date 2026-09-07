export interface GovernmentUser {
  id: number;
  name: string;
  email: string;
  department: string;
  designation: string;
  jurisdiction_city: string;
  jurisdiction_state: string;
  phone: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface GovRegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  designation: string;
  jurisdiction_city: string;
  jurisdiction_state: string;
  phone: string;
  employee_id: string;
  office_address: string;
  justification: string;
}

export interface GovernmentAction {
  id: number;
  gov_user_id: number;
  gov_user_name?: string;
  gov_user_designation?: string;
  official_name?: string;
  official_designation?: string;
  problem_id: number;
  action_type: string;
  remarks: string;
  budget_estimate: number | null;
  timeline_days: number | null;
  created_at: string;
}

export type GovReviewStatus = 'DISCARDED' | 'PENDING_REVIEW' | 'GOV_APPROVED' | 'GOV_REJECTED';

export interface GovProblem {
  id: number;
  problem_title: string;
  problem_description: string;
  domain: string;
  responsible_fields: string[];
  severity: string;
  confidence: number;
  status: string;
  priority_score: number;
  gov_review_status: GovReviewStatus;
  discard_reason: string | null;
  review_remarks: string | null;
  reviewed_at: string | null;
  report_count: number;
  location_count: number;
  locations: { latitude: number | null; longitude: number | null }[];
  created_at: string;
  actions?: { id: number; action_type: string; created_at: string }[];
}

export interface DashboardStats {
  total_problems: number;
  high_priority: number;
  actions_taken: number;
  problems_resolved: number;
  pending_approval: number;
}

export interface AiBrief {
  impact_assessment: string;
  recommended_actions: string[];
  resource_estimate: string;
  priority_score: number;
}

export const DEPARTMENTS = [
  'Public Works', 'Water Supply', 'Sanitation', 'Transportation',
  'Urban Planning', 'Health', 'Education', 'Environment',
  'Revenue', 'Law & Order', 'Housing', 'Social Welfare',
  'IT & Digital Services', 'Agriculture', 'Energy & Power',
] as const;

export const DESIGNATIONS = [
  'Commissioner', 'Director', 'Joint Director', 'Deputy Director',
  'Officer', 'Assistant Officer', 'Clerk', 'Other',
] as const;

export interface GovStudent {
  studentId: number;
  name: string;
  college: string;
  branch: string;
  yearOfStudy: string;
  status: string;
  joinedAt: string;
  solutionText: string | null;
  contact: { email: string | null; phone: string | null } | null;
}
