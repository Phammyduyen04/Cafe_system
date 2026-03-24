import { api } from "../lib/api";

export interface AccountInfo {
  accountId: string;
  username: string;
  fullName: string | null;
  email: string | null;
  userType: string;
  status: string;
  roles: string[];
  hasPassword: boolean;
  isGoogleAccount: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface CreatedAccount extends AccountInfo {
  password: string;
  position: string;
  branch: string | null;
  startDate: string | null;
}

export interface CreateStaffPayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  position: string;
  startDate?: string;
}

export interface RoleInfo {
  role_id: string;
  role_name: string;
  description?: string;
}

export const adminService = {
  /* ── Accounts ── */
  listAccounts: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.userType) qs.set("userType", params.userType);
    if (params?.status) qs.set("status", params.status);
    return api.getRaw<{
      success: boolean;
      data: AccountInfo[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/auth/admin/accounts?${qs}`);
  },

  getAccount: (id: string) =>
    api.get<AccountInfo>(`/api/auth/admin/accounts/${id}`),

  createStaffAccount: (payload: CreateStaffPayload) =>
    api.post<CreatedAccount>("/api/auth/admin/accounts", payload),

  updateAccount: (
    id: string,
    data: { fullName?: string; email?: string; userType?: string }
  ) => api.put<AccountInfo>(`/api/auth/admin/accounts/${id}`, data),

  toggleStatus: (id: string) =>
    api.put<{ accountId: string; username: string; status: string }>(
      `/api/auth/admin/accounts/${id}/status`,
      {}
    ),

  resetPassword: (id: string, newPassword: string) =>
    api.put<{ accountId: string; username: string }>(
      `/api/auth/admin/accounts/${id}/reset-password`,
      { newPassword }
    ),

  /* ── Roles ── */
  getRoles: () => api.get<RoleInfo[]>("/api/auth/admin/roles"),

  assignRole: (accountId: string, roleId: string) =>
    api.post("/api/auth/admin/roles/assign", { accountId, roleId }),

  revokeRole: (accountId: string, roleId: string) =>
    api.post("/api/auth/admin/roles/revoke", { accountId, roleId }),
};
