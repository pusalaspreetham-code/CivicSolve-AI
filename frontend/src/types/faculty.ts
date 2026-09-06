export interface Faculty {
  id: number;
  name: string;
  email: string;
  department: string;
  expertise: string;
  created_at: string;
  updated_at?: string;
  university_id?: number;
  university_name?: string;
}

export type GuidanceStatus = "PENDING" | "ACCEPTED" | "DENIED";

export interface GuidanceRequest {
  id: number;
  status: GuidanceStatus;
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  faculty_id: number;
  faculty_name: string;
  faculty_email: string;
  department: string;
  expertise: string;
  problem_id: number;
  problem_title: string;
  team_id: number | null;
  team_name: string | null;
}
