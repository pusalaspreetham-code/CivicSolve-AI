import api from "./api";
import { RegisterFormData } from "../types/auth";
import { Student } from "../types/student";

export const sendOtp = async (email: string) => {
  const { data } = await api.post("/auth/send-otp", { email });
  return data;
};

export const registerStudent = async (form: RegisterFormData, otp: string) => {
  const { data } = await api.post("/auth/register", { ...form, otp });
  return data;
};

export const login = async (email: string, password: string): Promise<{ token: string; student: Student }> => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } finally {
    localStorage.removeItem("csai_token");
    localStorage.removeItem("csai_student");
  }
};
