import axios from 'axios';

const govApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
govApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csai_gov_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor
govApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored credentials so the auth context picks up the change.
      // Do NOT do a hard window.location redirect here — that destroys
      // React state and causes login loops.  Instead let the component
      // tree (GovProtectedRoute) handle the redirect naturally.
      localStorage.removeItem('csai_gov_token');
      localStorage.removeItem('csai_gov_user');
    }
    return Promise.reject(error);
  }
);

export default govApi;
