import apiClient from "./apiClient";
import type { User } from "../types";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export function login(data: LoginPayload) {
  return apiClient.post<AuthResponse>("/auth/login", data);
}

export function register(data: RegisterPayload) {
  return apiClient.post("/auth/register", data);
}
