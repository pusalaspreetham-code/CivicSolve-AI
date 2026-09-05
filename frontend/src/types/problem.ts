export interface Location {
  latitude: number;
  longitude: number;
}

export type Severity = "Critical" | "High" | "Medium" | "Low" | string;
export type ProblemStatus = "INTERESTED" | "WORKING" | "COMPLETED";

export interface Problem {
  id: number;
  problem_title: string;
  problem_description: string;
  domain: string;
  responsible_fields: string[];
  severity: Severity;
  confidence: number;
  image_path: string | null;
  image_description: string | null;
  locations: Location[];
  report_count: number;
  location_count: number;
  solution_text?: string | null;
  solution_submitted_at?: string | null;
}

export interface MyProblem {
  student_problem_id: number;
  status: ProblemStatus;
  joined_at: string;
  updated_at: string;
  problem_id: number;
  problem_title: string;
  domain: string;
  responsible_fields: string[];
  severity: Severity;
  report_count: number;
  location_count: number;
  solution_text?: string | null;
  solution_submitted_at?: string | null;
}
