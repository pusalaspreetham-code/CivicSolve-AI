import api from "./api";
import { Team, TeamIndustryConversationSummary, TeamIndustryMessage } from "../types/team";

export const createTeam = async (name: string, problemId: number): Promise<Team> => {
  const { data } = await api.post("/teams", { name, problemId });
  return data.team;
};

export const joinTeam = async (inviteCode: string): Promise<{ team: Team; alreadyMember: boolean; message: string }> => {
  const { data } = await api.post("/teams/join", { inviteCode });
  return data;
};

export const getMyTeams = async (): Promise<Team[]> => {
  const { data } = await api.get("/teams/mine");
  return data.teams;
};

export const getTeamsForProblem = async (problemId: number | string): Promise<Team[]> => {
  const { data } = await api.get(`/teams/problem/${problemId}`);
  return data.teams;
};

export const leaveTeam = async (teamId: number) => {
  const { data } = await api.delete(`/teams/${teamId}/leave`);
  return data;
};

export const getTeamSolution = async (teamId: number) => {
  const { data } = await api.get(`/teams/${teamId}/solution`);
  return data.solution;
};

export const saveTeamSolution = async (teamId: number, solutionText: string, evidenceLink: string) => {
  const { data } = await api.put(`/teams/${teamId}/solution`, { solutionText, evidenceLink });
  return data;
};

// ------------------------------------------------------------
// Messaging with industries that adopted this team's problem
// ------------------------------------------------------------

export const getTeamIndustryConversations = async (teamId: number): Promise<TeamIndustryConversationSummary[]> => {
  const { data } = await api.get(`/teams/${teamId}/industry-conversations`);
  return data.conversations;
};

export const getTeamIndustryMessages = async (
  teamId: number,
  industryId: number
): Promise<{ industry: { id: number; company_name: string }; messages: TeamIndustryMessage[] }> => {
  const { data } = await api.get(`/teams/${teamId}/industry-conversations/${industryId}`);
  return data;
};

export const sendTeamIndustryMessage = async (teamId: number, industryId: number, message: string) => {
  const { data } = await api.post(`/teams/${teamId}/industry-conversations/${industryId}`, { message });
  return data;
};
