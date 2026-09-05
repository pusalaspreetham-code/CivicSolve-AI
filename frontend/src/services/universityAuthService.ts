import universityApi from "./universityApi";
import { University, UniversityRegisterFormData } from "../types/university";

export const sendOtp = async (email: string) => {
  const { data } = await universityApi.post("/university/auth/send-otp", { email });
  return data;
};

export const registerUniversity = async (form: UniversityRegisterFormData, otp: string) => {
  const { data } = await universityApi.post("/university/auth/register", { ...form, otp });
  return data;
};

export const login = async (email: string, password: string): Promise<{ token: string; university: University }> => {
  const { data } = await universityApi.post("/university/auth/login", { email, password });
  return data;
};

export const logout = async () => {
  try {
    await universityApi.post("/university/auth/logout");
  } finally {
    localStorage.removeItem("csai_university_token");
    localStorage.removeItem("csai_university");
  }
};
