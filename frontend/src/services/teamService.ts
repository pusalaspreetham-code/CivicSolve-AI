import api from "./api";
import { Team } from "../types/team";

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
