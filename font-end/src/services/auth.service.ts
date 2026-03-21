import { api } from "../lib/api";
import type { AuthUser } from "../contexts/AuthContext";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface RegisterResponse {
  message: string;
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { email, password }),

  register: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => api.post<RegisterResponse>("/api/auth/register", data),

  logout: () => api.post<void>("/api/auth/logout", {}),

  getMe: () => api.get<{ user: AuthUser }>("/api/auth/me"),

  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string }>("/api/auth/refresh-token", { refreshToken }),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<void>("/api/auth/change-password", { oldPassword, newPassword }),
};
