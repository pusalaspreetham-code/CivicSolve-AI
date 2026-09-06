import api from "./api";
import { Faculty, GuidanceRequest } from "../types/faculty";

export const getFaculty = async (): Promise<Faculty[]> => {
  const { data } = await api.get("/students/faculty");
  return data.faculty;
};

export const requestGuidance = async (facultyId: number, problemId: number, message?: string) => {
  const { data } = await api.post("/students/faculty/guidance-requests", { facultyId, problemId, message });
  return data;
};

export const getMyGuidanceRequests = async (): Promise<GuidanceRequest[]> => {
  const { data } = await api.get("/students/faculty/guidance-requests");
  return data.requests;
};
