import axios, { AxiosError } from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

const normalizeToken = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^Bearer\s+/i, "");
};

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const rawToken = localStorage.getItem("token");
    const token = normalizeToken(rawToken);

    if (token) {
      if (config.headers) {
        (config.headers as Record<string, string>).Authorization =
          `Bearer ${token}`;
      } else {
        config.headers = {
          Authorization: `Bearer ${token}`,
        } as import("axios").AxiosRequestHeaders;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest =
      requestUrl === "/auth/login" || requestUrl.endsWith("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
