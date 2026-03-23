import { api } from "../lib/api";

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Customer {
  customer_id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  points: number;
  customer_type: string;
  customer_status: string;
  created_at: string;
}

export interface PointLog {
  point_log_id: string;
  customer_id: string;
  change_type: string;
  points_changed: number;
  reason: string | null;
  order_id: string | null;
  created_at: string;
}

export const customerService = {
  getAll: async (page = 1, limit = 10, search?: string) => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (search) qs.set("search", search);
    return await api.getRaw<PaginatedResponse<Customer>>(
      `/api/customers?${qs}`
    );
  },

  getPointLogs: async (customerId: string) => {
    return await api.get<PointLog[]>(`/api/customers/${customerId}/point-logs`);
  },

  adjustPoints: async (customerId: string, points: number, reason?: string) => {
    return await api.post(`/api/customers/${customerId}/points/adjust`, { points, reason });
  },
};
