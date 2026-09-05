import api from "./api";
import { Problem, MyProblem, ProblemStatus } from "../types/problem";

export const getRelevantProblems = async (): Promise<{ studentBranch: string; problems: Problem[] }> => {
  const { data } = await api.get("/problems/relevant");
  return data;
};

export const getProblemById = async (id: number | string): Promise<{ problem: Problem; myStatus: ProblemStatus | null }> => {
  const { data } = await api.get(`/problems/${id}`);
  return data;
};

export const getProblemsForMap = async (filters: { domain?: string; severity?: string; status?: string } = {}): Promise<{ studentBranch: string; problems: Problem[] }> => {
  const { data } = await api.get("/problems/map", { params: filters });
  return data;
};

export const getAllProblems = async (filters: { domain?: string; severity?: string } = {}): Promise<{ studentBranch: string; problems: Problem[] }> => {
  const { data } = await api.get("/problems/map", { params: { ...filters, allBranches: "true" } });
  return data;
};

export const joinProblem = async (id: number | string) => {
  const { data } = await api.post(`/problems/${id}/join`);
  return data;
};

export const getMyProblems = async (): Promise<MyProblem[]> => {
  const { data } = await api.get("/students/my-problems");
  return data.myProblems;
};

export const updateMyProblemStatus = async (studentProblemId: number, status: ProblemStatus, solutionText?: string) => {
  const { data } = await api.patch(`/students/my-problems/${studentProblemId}`, { status, solutionText });
  return data.studentProblem;
};

export const removeMyProblem = async (studentProblemId: number) => {
  const { data } = await api.delete(`/students/my-problems/${studentProblemId}`);
  return data;
};

export const getProblemTracking = async (id: number | string) => {
  const { data } = await api.get(`/problems/${id}/tracking`);
  return data;
};

export const searchProblemsByName = async (q: string): Promise<Problem[]> => {
  if (!q || q.trim().length < 2) return [];
  const { data } = await api.get("/problems/search", { params: { q } });
  return data.results;
};
