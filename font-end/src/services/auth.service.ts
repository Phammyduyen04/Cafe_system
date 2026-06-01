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

  updateProfile: (data: { fullName?: string; email?: string }) =>
    api.put<AuthUser>("/api/auth/me", data),

  uploadAvatar: async (file: File) => {
    const token = localStorage.getItem("accessToken");
    const form = new FormData();
    form.append("avatar", file);
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${BASE_URL}/api/auth/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).message ?? `Lỗi ${res.status}`);
    }
    return res.json() as Promise<{ success: boolean; data: { avatar: string } }>;
  },

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
