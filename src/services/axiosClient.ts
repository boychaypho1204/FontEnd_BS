import axios from "axios";
import { toast } from "react-toastify";

const TOKEN_STORAGE_KEY = "admin_access_token";

interface ApiResponse<T> {
  status: number | string;
  message?: string;
  data: T;
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    localStorage.getItem("accessToken") ||
    "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => {
    const payload = response?.data as ApiResponse<unknown> | undefined;

    if (payload && typeof payload === "object" && "data" in payload) {
      return {
        ...response,
        data: payload.data,
      };
    }

    return response;
  },
  async (error) => {
    const responseData = error?.response?.data;
    const message =
      responseData?.message ||
      responseData?.error ||
      responseData?.detail ||
      (typeof responseData === "string" ? responseData : null) ||
      error?.message ||
      "Request failed";

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      if (window.location.pathname !== "/login") {
        toast.error("Session expired. Please sign in again.");
        window.location.assign("/login");
      }
    } else if (error.response?.status === 403) {
      toast.error(message || "Access Denied");
    } else if (message) {
      toast.error(message);
    }

    return Promise.reject(new Error(message));
  },
);

export default axiosClient;
