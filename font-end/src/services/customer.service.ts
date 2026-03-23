import { api } from "../lib/api";

export interface Customer {
  customer_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  points: number;
  customer_type: "REGULAR" | "VIP";
  account_id: string | null;
  customer_status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
}

export interface PointLog {
  point_log_id: string;
  customer_id: string;
  change_type: "EARN" | "REDEEM" | "ADJUST";
  points_changed: number;
  reason: string | null;
  order_id: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const customerService = {
  getAll: (page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return api.get<PaginatedResponse<Customer>>(`/api/customers?${params}`);
  },

  getById: (id: string) => api.get<Customer>(`/api/customers/${id}`),

  getByAccountId: (accountId: string) =>
    api.get<Customer>(`/api/customers/by-account/${accountId}`),

  createFromAuth: (data: { fullName: string; accountId: string; email?: string }) =>
    api.post<Customer>("/api/customers", data),

  updateMyProfile: (data: { fullName?: string; email?: string; phoneNumber?: string }) =>
    api.put<Customer>("/api/customers/me", data),

  deleteMyAccount: () =>
    api.delete<void>("/api/customers/me"),

  getPoints: (id: string) => api.get<{ points: number }>(`/api/customers/${id}/points`),

  getPointLogs: (id: string) => api.get<PointLog[]>(`/api/customers/${id}/point-logs`),

  adjustPoints: (id: string, points: number, reason?: string) =>
    api.post<{ customerId: string; previousPoints: number; newPoints: number; changed: number }>(
      `/api/customers/${id}/points/adjust`,
      { points, reason }
    ),

  redeemPoints: (id: string, points: number, reason?: string) =>
    api.post<{ customerId: string; previousPoints: number; newPoints: number; changed: number }>(
      `/api/customers/${id}/points/redeem`,
      { points, reason }
    ),
};
