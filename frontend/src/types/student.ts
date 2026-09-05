export interface Student {
  id: number;
  name: string;
  email: string;
  college: string;
  branch: string;
  year_of_study: string;
  phone: string;
  city: string;
  email_verified: boolean;
  university_id?: number | null;
  created_at: string;
  updated_at: string;
}
