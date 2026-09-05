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
}
