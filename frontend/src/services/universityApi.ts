import axios from "axios";

const universityApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

universityApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("csai_university_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

universityApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("csai_university_token");
      localStorage.removeItem("csai_university");
      if (window.location.pathname !== "/university/login") {
        window.location.href = "/university/login";
      }
    }
    const message =
      error.response?.data?.message || error.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default universityApi;
