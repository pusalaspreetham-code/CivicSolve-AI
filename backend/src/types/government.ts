export interface GovernmentUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  department: string;
  designation: string;
  jurisdiction_city: string;
  jurisdiction_state: string;
  phone: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicGovernmentUser = Omit<GovernmentUser, 'password_hash'>;

export interface GovJwtPayload {
  govId: number;
  email: string;
}

export interface GovernmentAction {
  id: number;
  gov_user_id: number;
  problem_id: number;
  action_type: string;
  remarks: string | null;
  budget_estimate: number | null;
  timeline_days: number | null;
  created_at: string;
}

export const VALID_DEPARTMENTS = [
  'Public Works',
  'Water Supply',
  'Sanitation',
  'Transportation',
  'Urban Planning',
  'Health',
  'Education',
  'Environment',
  'Revenue',
  'Law & Order',
  'Housing',
  'Social Welfare',
  'IT & Digital Services',
  'Agriculture',
  'Energy & Power'
];

export const VALID_DESIGNATIONS = [
  'Commissioner',
  'Director',
  'Joint Director',
  'Deputy Director',
  'Officer',
  'Assistant Officer',
  'Clerk',
  'Other'
];

export const VALID_ACTION_TYPES = [
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'BUDGET_ALLOCATED',
  'RESOLVED',
  'REJECTED'
];

declare global {
  namespace Express {
    interface Request {
      govId?: number;
      govEmail?: string;
    }
  }
}
