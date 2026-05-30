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
    phone?: string;
  }) =>
    api.post<RegisterResponse>("/api/auth/register", {
      username: data.username,
      password: data.password,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phone,
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

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/api/auth/forgot-password", { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<void>("/api/auth/reset-password", { email, code, newPassword }),

  googleLogin: async (credential: string) => {
    const res = await api.post<LoginResponse>("/api/auth/google", {
      idToken: credential,
    });
    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      user: res.account,
    };
  },
};
