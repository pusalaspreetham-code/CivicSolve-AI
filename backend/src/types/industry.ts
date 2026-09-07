export interface Industry {
  id: number;
  company_name: string;
  email: string;
  domain: string;
  password_hash: string;
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

export type PublicIndustry = Omit<Industry, "password_hash">;

export interface IndustryJwtPayload {
  industryId: number;
  email: string;
  role: "industry";
}

export type CommitmentType = "MENTORSHIP" | "PILOT_FUNDING" | "HARDWARE_RESOURCES" | "FIELD_DEPLOYMENT";
export type AdoptionStatus = "EVALUATING" | "ACTIVE" | "PILOT_DEPLOYED" | "RESOLVED";

export interface IndustryProblemAdoption {
  id: number;
  industry_id: number;
  problem_id: number;
  commitment_type: CommitmentType;
  status: AdoptionStatus;
  notes: string | null;
  budget_estimate: number;
  created_at: string;
  updated_at: string;
}

export interface IndustrySolutionReview {
  id: number;
  industry_id: number;
  student_problem_id: number;
  review_text: string;
  rating: number;
  pilot_interest: boolean;
  created_at: string;
}

export const VALID_INDUSTRY_SECTORS = [
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

declare global {
  namespace Express {
    interface Request {
      industryId?: number;
      industryEmail?: string;
    }
  }
}
