import govApi from './govApi';
import { GovernmentUser } from '../types/government';

export const govService = {
  getMe: async (): Promise<GovernmentUser> => {
    const response = await govApi.get('/gov/me');
    return response.data.user || response.data;
  },

  updateMe: async (data: Partial<GovernmentUser>): Promise<GovernmentUser> => {
    const response = await govApi.put('/gov/me', data);
    return response.data.user || response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const response = await govApi.put('/gov/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};
