import govApi from './govApi';
import { GovernmentAction, DashboardStats, AiBrief, GovStudent } from '../types/government';

export const govProblemService = {
  getProblems: async (filters?: { severity?: string; domain?: string; actionStatus?: string; reviewStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.domain) params.append('domain', filters.domain);
      if (filters.actionStatus) params.append('actionStatus', filters.actionStatus);
      if (filters.reviewStatus) params.append('reviewStatus', filters.reviewStatus);
    }
    const response = await govApi.get(`/gov/problems?${params.toString()}`);
    return response.data.problems || response.data;
  },

  // The priority-sorted approval queue: problems the AI pipeline judged
  // worth a human look, not yet approved or rejected by any official.
  getPendingProblems: async () => {
    const response = await govApi.get('/gov/problems/pending');
    return response.data.problems || [];
  },

  approveProblem: async (problemId: number | string, remarks?: string) => {
    const response = await govApi.post(`/gov/problems/${problemId}/approve`, { remarks });
    return response.data;
  },

  rejectProblem: async (problemId: number | string, remarks: string) => {
    const response = await govApi.post(`/gov/problems/${problemId}/reject`, { remarks });
    return response.data;
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

  getAiBrief: async (problemId: number | string, regenerate?: boolean): Promise<{ brief: AiBrief; generated_at?: string }> => {
    const params = regenerate ? '?regenerate=true' : '';
    const response = await govApi.get(`/gov/problems/${problemId}/ai-brief${params}`);
    return { brief: response.data.brief || response.data, generated_at: response.data.generated_at };
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await govApi.get('/gov/dashboard/stats');
    return response.data.stats || response.data;
  },

  getStudents: async (problemId: number | string): Promise<GovStudent[]> => {
    const response = await govApi.get(`/gov/problems/${problemId}/students`);
    return response.data.students || [];
  },

  removeStudent: async (problemId: number | string, studentId: number | string, reason: string) => {
    const response = await govApi.delete(`/gov/problems/${problemId}/students/${studentId}`, { data: { reason } });
    return response.data;
  },
};
