import govApi from './govApi';
import { GovRegisterFormData, GovernmentUser } from '../types/government';

export const govAuthService = {
  sendOtp: async (email: string) => {
    const response = await govApi.post('/gov/auth/send-otp', { email });
    return response.data;
  },

  registerGovUser: async (data: GovRegisterFormData, otp: string) => {
    const response = await govApi.post('/gov/auth/register', { ...data, otp });
    return response.data;
  },

  login: async (email: string, password: string): Promise<{ token: string; user: GovernmentUser }> => {
    const response = await govApi.post('/gov/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    try {
      await govApi.post('/gov/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('csai_gov_token');
      localStorage.removeItem('csai_gov_user');
    }
  },
};
