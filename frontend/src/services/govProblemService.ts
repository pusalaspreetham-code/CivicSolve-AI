import govApi from './govApi';
import { GovernmentAction, DashboardStats, AiBrief } from '../types/government';

export const govProblemService = {
  getProblems: async (filters?: { severity?: string; domain?: string; actionStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.domain) params.append('domain', filters.domain);
      if (filters.actionStatus) params.append('actionStatus', filters.actionStatus);
    }
    const response = await govApi.get(`/gov/problems?${params.toString()}`);
    return response.data.problems || response.data;
  },

  getProblemById: async (id: number | string) => {
    const response = await govApi.get(`/gov/problems/${id}`);
    return response.data.problem || response.data;
  },

  createAction: async (problemId: number | string, data: Partial<GovernmentAction>) => {
    const response = await govApi.post(`/gov/problems/${problemId}/action`, data);
    return response.data.action || response.data;
  },

  getActions: async (problemId: number | string): Promise<GovernmentAction[]> => {
    const response = await govApi.get(`/gov/problems/${problemId}/actions`);
    return response.data.actions || response.data;
  },

  getAiBrief: async (problemId: number | string): Promise<AiBrief> => {
    const response = await govApi.get(`/gov/problems/${problemId}/ai-brief`);
    return response.data.brief || response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await govApi.get('/gov/dashboard/stats');
    return response.data.stats || response.data;
  },
};
