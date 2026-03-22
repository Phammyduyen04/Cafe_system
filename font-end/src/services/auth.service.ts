import { api } from "../lib/api";
import type { AuthUser } from "../contexts/AuthContext";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  account: AuthUser;
}

interface RegisterResponse {
  accountId: string;
  username: string;
  userType: string;
}

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post<LoginResponse>("/api/auth/login", {
      username,
      password,
    });
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.account,
    };
  },

  register: (data: {
    username: string;
    fullName: string;
    email: string;
    password: string;
  }) =>
    api.post<RegisterResponse>("/api/auth/register", {
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      email: data.email,
    }),

  logout: () => {
    const refreshToken = localStorage.getItem("refreshToken");
    return api.post<void>("/api/auth/logout", { refreshToken });
  },

  getMe: () => api.get<AuthUser>("/api/auth/me"),

  refreshToken: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>(
      "/api/auth/refresh-token",
      { refreshToken }
    ),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<void>("/api/auth/change-password", { oldPassword, newPassword }),
};
