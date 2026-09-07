import axios from "axios";

const industryApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

industryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("csai_industry_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

industryApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("csai_industry_token");
      localStorage.removeItem("csai_industry");
      if (window.location.pathname !== "/industry/login") {
        window.location.href = "/industry/login";
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default industryApi;
