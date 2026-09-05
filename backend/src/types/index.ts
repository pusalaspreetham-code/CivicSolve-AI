export interface Student {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  college: string;
  branch: string;
  year_of_study: string;
  phone: string;
  city: string;
  email_verified: boolean;
  university_id: number | null;
  created_at: string;
  updated_at: string;
}

export type PublicStudent = Omit<Student, "password_hash">;

export interface University {
  id: number;
  name: string;
  email: string;
  domain: string;
  password_hash: string;
  contact_person: string;
  phone: string;
  city: string;
  state: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicUniversity = Omit<University, "password_hash">;

export interface JwtPayload {
  studentId: number;
  email: string;
}

export interface UniversityJwtPayload {
  universityId: number;
  email: string;
  role: "university";
}

export type ProblemStatus = "INTERESTED" | "WORKING" | "COMPLETED";

export const VALID_BRANCHES = [
  "Computer Science and Engineering",
  "Information Technology",
  "Artificial Intelligence and Machine Learning",
  "Data Science",
  "Cyber Security",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Instrumentation and Control Engineering",
  "Mechanical Engineering",
  "Automobile Engineering",
  "Mechatronics Engineering",
  "Robotics and Automation",
  "Civil Engineering",
  "Environmental Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Biomedical Engineering",
  "Agricultural Engineering",
  "Food Technology",
  "Metallurgical and Materials Engineering",
  "Mining Engineering",
  "Aerospace and Aeronautical Engineering",
  "Architecture",
  "Other",
];

export const VALID_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

declare global {
  namespace Express {
    interface Request {
      studentId?: number;
      studentEmail?: string;
      universityId?: number;
      universityEmail?: string;
    }
  }
}
