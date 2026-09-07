export interface TeamMember {
  id: number;
  role: "LEADER" | "MEMBER";
  joined_at: string;
  student_id: number;
  name: string;
  college: string;
  branch: string;
  year_of_study: string;
}

export interface Team {
  id: number;
  name: string;
  problem_id: number;
  invite_code: string;
  created_by: number;
  max_members: number;
  created_at: string;
  problem_title: string;
  domain: string;
  severity: string;
  member_count: number;
  members: TeamMember[];
  solution_text?: string | null;
  evidence_link?: string | null;
  solution_updated_at?: string | null;
  solution_updated_by?: number | null;
}

export interface TeamIndustryConversationSummary {
  industry_id: number;
  company_name: string;
  sector: string;
  adoption_status: string;
  last_message: string | null;
  last_sender_type: "INDUSTRY" | "STUDENT" | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface TeamIndustryMessage {
  id: number;
  sender_type: "INDUSTRY" | "STUDENT";
  message: string;
  created_at: string;
  sender_student_name: string | null;
}
