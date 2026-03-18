import axios from "axios";
import { authClient } from "@/lib/auth-client";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await authClient.getSession();
  if (data?.session?.token) {
    config.headers.Authorization = `Bearer ${data.session.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await authClient.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
