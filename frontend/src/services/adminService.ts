import adminApi from './adminApi';

export const adminService = {
  login: async (email, password) => {
    const response = await adminApi.post('/admin/auth/login', { email, password });
    return response.data;
  },
  listGovUsers: async (status?) => {
    const url = status ? `/admin/gov-users?status=${status}` : '/admin/gov-users';
    const response = await adminApi.get(url);
    return response.data;
  },
  getGovUser: async (id) => {
    const response = await adminApi.get(`/admin/gov-users/${id}`);
    return response.data;
  },
  approveGovUser: async (id) => {
    const response = await adminApi.post(`/admin/gov-users/${id}/approve`);
    return response.data;
  },
  rejectGovUser: async (id, reason) => {
    const response = await adminApi.post(`/admin/gov-users/${id}/reject`, { reason });
    return response.data;
  },
  suspendGovUser: async (id, reason) => {
    const response = await adminApi.post(`/admin/gov-users/${id}/suspend`, { reason });
    return response.data;
  }
};
