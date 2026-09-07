export interface Industry {
  id: number;
  company_name: string;
  email: string;
  domain: string;
  contact_person: string;
  designation: string;
  phone: string;
  sector: string;
  city: string;
  state: string;
  website: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface IndustryRegisterFormData {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactPerson: string;
  designation: string;
  phone: string;
  sector: string;
  city: string;
  state: string;
  website?: string;
}

export type CommitmentType = "MENTORSHIP" | "PILOT_FUNDING" | "HARDWARE_RESOURCES" | "FIELD_DEPLOYMENT";
export type AdoptionStatus = "EVALUATING" | "ACTIVE" | "PILOT_DEPLOYED" | "RESOLVED";

export interface IndustryDashboardStats {
  totalProblems: number;
  sectorProblems: number;
  solutionsAvailable: number;
  activeAdoptions: number;
  totalGrants: number;
  adoptionsBreakdown: { status: string; count: number }[];
}

export interface IndustryAdoptionItem {
  id: number;
  problem_id: number;
  problem_title: string;
  domain: string;
  responsible_fields?: string[];
  severity: string;
  commitment_type: CommitmentType;
  status: AdoptionStatus;
  notes: string | null;
  budget_estimate: number;
  report_count: number;
  solution_count: number;
  created_at: string;
  updated_at?: string;
}

export interface IndustryProblemSummary {
  id: number;
  problem_title: string;
  problem_description: string;
  domain: string;
  responsible_fields: string[];
  severity: string;
  confidence: number;
  locations: { latitude: number; longitude: number }[];
  report_count: number;
  solution_count: number;
  working_students: number;
  industry_adoptions_count: number;
  adopted_by_me: boolean;
}

export interface SolutionReview {
  id: number;
  rating: number;
  review_text: string;
  pilot_interest: boolean;
  company_name: string;
  created_at: string;
}

export interface StudentSolution {
  student_problem_id: number;
  status: string;
  joined_at: string;
  solution_text: string | null;
  solution_submitted_at: string | null;
  student_id: number;
  student_name: string;
  college: string;
  branch: string;
  year_of_study: string;
  reviews: SolutionReview[];
}

export interface ProblemTeam {
  id: number;
  name: string;
  max_members: number;
  created_at: string;
  leader_name: string;
  member_count: number;
  can_message: boolean;
}

export interface IndustryConversationSummary {
  team_id: number;
  team_name: string;
  problem_id: number;
  problem_title: string;
  member_count: number;
  last_message: string | null;
  last_sender_type: "INDUSTRY" | "STUDENT" | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface IndustryTeamMessage {
  id: number;
  sender_type: "INDUSTRY" | "STUDENT";
  message: string;
  created_at: string;
  sender_student_name: string | null;
}

export interface IndustryProblemDetail {
  problem: {
    id: number;
    problem_title: string;
    problem_description: string;
    domain: string;
    responsible_fields: string[];
    severity: string;
    confidence: number;
    locations: { latitude: number; longitude: number }[];
    image_path?: string;
    image_description?: string;
    created_at: string;
    report_count: number;
  };
  myAdoption: {
    id: number;
    commitment_type: CommitmentType;
    status: AdoptionStatus;
    notes: string | null;
    budget_estimate: number;
    created_at: string;
  } | null;
  allAdoptions: {
    id: number;
    commitment_type: CommitmentType;
    status: AdoptionStatus;
    created_at: string;
    company_name: string;
    sector: string;
  }[];
  studentSolutions: StudentSolution[];
  teams: ProblemTeam[];
}

export const INDUSTRY_SECTORS = [
  "Energy",
  "Road Infrastructure",
  "Water Supply & Sanitation",
  "Waste Management & Recycling",
  "Public Transport & Mobility",
  "Healthcare & Medical Devices",
  "IT, Software & Cybersecurity",
  "Artificial Intelligence & Data Solutions",
  "Civil Construction & Urban Planning",
  "Agriculture & Food Tech",
  "Environmental & Pollution Control",
  "Electrical & Power Systems",
  "Robotics & Automation",
  "Other",
];
