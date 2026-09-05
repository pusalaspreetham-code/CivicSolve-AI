export interface University {
  id: number;
  name: string;
  email: string;
  domain: string;
  contact_person: string;
  phone: string;
  city: string;
  state: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UniversityRegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactPerson: string;
  phone: string;
  city: string;
  state: string;
}

export interface UniversityDashboardStats {
  studentsRegistered: number;
  universitiesOnPlatform: number;
  universitiesActivelyWorking: number;
  teamsFromThisUniversity: number;
  statusBreakdown: { status: string; count: number }[];
}

export interface ProblemWorked {
  id: number;
  problem_title: string;
  domain: string;
  severity: string;
  our_students: number;
  universities_working: number;
}

export interface RecentStudent {
  id: number;
  name: string;
  email: string;
  branch: string;
  year_of_study: string;
  created_at: string;
}
