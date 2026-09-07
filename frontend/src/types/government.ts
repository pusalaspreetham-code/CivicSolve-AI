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

export interface DashboardStats {
  total_problems: number;
  high_priority: number;
  actions_taken: number;
  problems_resolved: number;
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
