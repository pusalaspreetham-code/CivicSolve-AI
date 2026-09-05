export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  college: string;
  branch: string;
  year_of_study: string;
  phone: string;
  city: string;
}

export const BRANCHES = [
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

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];
