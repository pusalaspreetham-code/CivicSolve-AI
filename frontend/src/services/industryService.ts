import industryApi from "./industryApi";
import {
  Industry,
  IndustryDashboardStats,
  IndustryProblemSummary,
  IndustryProblemDetail,
  IndustryAdoptionItem,
  IndustryConversationSummary,
  IndustryTeamMessage,
} from "../types/industry";

export const getMe = async (): Promise<Industry> => {
  const { data } = await industryApi.get("/industry/me");
  return data.industry;
};

export const getDashboard = async (): Promise<{
  industry: { company_name: string; sector: string; domain: string };
  stats: IndustryDashboardStats;
  recentAdoptions: any[];
  recentSolutions: any[];
}> => {
  const { data } = await industryApi.get("/industry/dashboard");
  return data;
};

export const getProblems = async (params?: {
  domain?: string;
  severity?: string;
  hasSolutions?: boolean;
  search?: string;
}): Promise<IndustryProblemSummary[]> => {
  const { data } = await industryApi.get("/industry/problems", { params });
  return data.problems;
};

export const getProblemDetails = async (id: number | string): Promise<IndustryProblemDetail> => {
  const { data } = await industryApi.get(`/industry/problems/${id}`);
  return data;
};

export const adoptProblem = async (
  id: number | string,
  data: { commitmentType: string; notes?: string; budgetEstimate?: number }
) => {
  const res = await industryApi.post(`/industry/problems/${id}/adopt`, data);
  return res.data;
};

export const getMyAdoptions = async (): Promise<IndustryAdoptionItem[]> => {
  const { data } = await industryApi.get("/industry/adoptions");
  return data.adoptions;
};

export const updateAdoptionStatus = async (
  id: number | string,
  data: { status?: string; notes?: string; budgetEstimate?: number }
) => {
  const res = await industryApi.patch(`/industry/adoptions/${id}`, data);
  return res.data;
};

export const submitSolutionReview = async (
  studentProblemId: number | string,
  data: { reviewText: string; rating: number; pilotInterest: boolean }
) => {
  const res = await industryApi.post(`/industry/solutions/${studentProblemId}/review`, data);
  return res.data;
};

// ------------------------------------------------------------
// Messaging with student teams working on adopted problems
// ------------------------------------------------------------

export const getConversations = async (): Promise<IndustryConversationSummary[]> => {
  const { data } = await industryApi.get("/industry/messages");
  return data.conversations;
};

export const getTeamMessages = async (
  teamId: number | string
): Promise<{ team: { id: number; name: string; problem_id: number; problem_title: string }; messages: IndustryTeamMessage[] }> => {
  const { data } = await industryApi.get(`/industry/messages/${teamId}`);
  return data;
};

export const sendTeamMessage = async (teamId: number | string, message: string) => {
  const { data } = await industryApi.post(`/industry/messages/${teamId}`, { message });
  return data;
};
