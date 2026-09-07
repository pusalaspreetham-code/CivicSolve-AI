import industryApi from "./industryApi";
import { Industry, IndustryRegisterFormData } from "../types/industry";

export const sendOtp = async (email: string) => {
  const { data } = await industryApi.post("/industry/auth/send-otp", { email });
  return data;
};

export const registerIndustry = async (form: IndustryRegisterFormData, otp: string) => {
  const { data } = await industryApi.post("/industry/auth/register", { ...form, otp });
  return data;
};

export const login = async (
  email: string,
  password: string
): Promise<{ token: string; industry: Industry }> => {
  const { data } = await industryApi.post("/industry/auth/login", { email, password });
  return data;
};

export const logout = async () => {
  try {
    await industryApi.post("/industry/auth/logout");
  } finally {
    localStorage.removeItem("csai_industry_token");
    localStorage.removeItem("csai_industry");
  }
};
