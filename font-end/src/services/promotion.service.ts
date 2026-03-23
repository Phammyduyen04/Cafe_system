import { api } from "../lib/api";

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Promotion {
  promotionId: string;
  promotionName: string;
  description: string;
  benefitType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  conditions?: PromotionCondition;
}

export interface PromotionCondition {
  promotionId: string;
  triggerProducts: { productId: string; quantity: number }[];
  rewardProducts: { productId: string; quantity: number }[];
  minimumOrderAmount: number | null;
}

export interface Discount {
  discountId: string;
  discountName: string;
  discountType: string;
  discountValue: number;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  conditions?: DiscountCondition;
}

export interface DiscountCondition {
  discountId: string;
  minimumOrderAmount: number | null;
  applicableCustomerTypes: string[];
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  timeFrames: { from: string; to: string }[];
}

export const promotionService = {
  // ── Promotions ──
  getPromotions: (params?: { page?: number; limit?: number; status?: string }) => {
    if (params?.page !== undefined) {
      const qs = new URLSearchParams();
      qs.set("page", String(params.page));
      qs.set("limit", String(params.limit ?? 10));
      if (params.status) qs.set("status", params.status);
      return api.getRaw<PaginatedResponse<Promotion>>(`/api/promotions?${qs}`);
    }
    return api.get<Promotion[]>("/api/promotions");
  },

  getPromotionById: (id: string) =>
    api.get<Promotion>(`/api/promotions/${id}`),

  createPromotion: (data: Partial<Promotion>) =>
    api.post<Promotion>("/api/promotions", data),

  updatePromotion: (id: string, data: Partial<Promotion>) =>
    api.put<Promotion>(`/api/promotions/${id}`, data),

  deletePromotion: (id: string) =>
    api.delete(`/api/promotions/${id}`),

  updatePromotionConditions: (id: string, data: Partial<PromotionCondition>) =>
    api.put(`/api/promotions/${id}/conditions`, data),

  checkPromotions: (params?: { productIds?: string; orderAmount?: number }) => {
    const qs = new URLSearchParams();
    if (params?.productIds) qs.set("productIds", params.productIds);
    if (params?.orderAmount) qs.set("orderAmount", String(params.orderAmount));
    return api.get<Promotion[]>(`/api/promotions/check?${qs}`);
  },

  // ── Discounts ──
  getDiscounts: (params?: { page?: number; limit?: number; status?: string }) => {
    if (params && params.page !== undefined) {
      const qs = new URLSearchParams();
      qs.set("page", String(params.page));
      qs.set("limit", String(params.limit ?? 10));
      if (params.status) qs.set("status", params.status);
      return api.getRaw<PaginatedResponse<Discount>>(`/api/discounts?${qs}`);
    }
    return api.get<Discount[]>("/api/discounts");
  },

  getDiscountById: (id: string) =>
    api.get<Discount>(`/api/discounts/${id}`),

  createDiscount: (data: Partial<Discount>) =>
    api.post<Discount>("/api/discounts", data),

  updateDiscount: (id: string, data: Partial<Discount>) =>
    api.put<Discount>(`/api/discounts/${id}`, data),

  deleteDiscount: (id: string) =>
    api.delete(`/api/discounts/${id}`),

  updateDiscountConditions: (id: string, data: Partial<DiscountCondition>) =>
    api.put(`/api/discounts/${id}/conditions`, data),

  checkDiscount: (code: string, total?: number) => {
    const qs = new URLSearchParams({ code, ...(total ? { total: String(total) } : {}) });
    return api.get<Discount>(`/api/discounts/check?${qs}`);
  },
};
