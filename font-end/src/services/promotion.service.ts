import { api } from "../lib/api";

export interface Promotion {
  _id: string;
  promotionId: string;
  promotionName: string;
  benefitType: string;
  description: string;
  status: "PLANNED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  conditions?: PromotionCondition;
}

export interface PromotionCondition {
  promotionId: string;
  triggerProducts: { productId: string; quantity: number }[];
  rewardProducts: { productId: string; quantity: number }[];
  minimumOrderAmount: number | null;
  applicableCustomerTypes?: string[];
}

export interface Discount {
  _id: string;
  discountId: string;
  discountName: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  description: string;
  status: "PLANNED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
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

interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const promotionService = {
  // Promotions
  getPromotions: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    return api.get<Paginated<Promotion>>(`/api/promotions?${qs}`);
  },

  getPromotionById: (id: string) => api.get<Promotion>(`/api/promotions/${id}`),

  createPromotion: (data: {
    promotionName: string;
    benefitType: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => api.post<Promotion>("/api/promotions", data),

  updatePromotion: (id: string, data: Partial<Promotion>) =>
    api.put<Promotion>(`/api/promotions/${id}`, data),

  deletePromotion: (id: string) => api.delete<void>(`/api/promotions/${id}`),

  updatePromotionConditions: (id: string, data: Partial<PromotionCondition>) =>
    api.put<PromotionCondition>(`/api/promotions/${id}/conditions`, data),

  checkPromotions: (params?: { productIds?: string; orderAmount?: number }) => {
    const qs = new URLSearchParams();
    if (params?.productIds) qs.set("productIds", params.productIds);
    if (params?.orderAmount) qs.set("orderAmount", String(params.orderAmount));
    return api.get<Promotion[]>(`/api/promotions/check?${qs}`);
  },

  // Discounts — nằm trong /api/promotions/discounts
  getDiscounts: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    return api.get<Paginated<Discount>>(`/api/promotions/discounts?${qs}`);
  },

  getDiscountById: (id: string) => api.get<Discount>(`/api/promotions/discounts/${id}`),

  createDiscount: (data: {
    discountName: string;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => api.post<Discount>("/api/promotions/discounts", data),

  updateDiscount: (id: string, data: Partial<Discount>) =>
    api.put<Discount>(`/api/promotions/discounts/${id}`, data),

  deleteDiscount: (id: string) => api.delete<void>(`/api/promotions/discounts/${id}`),

  updateDiscountConditions: (id: string, data: Partial<DiscountCondition>) =>
    api.put<DiscountCondition>(`/api/promotions/discounts/${id}/conditions`, data),

  checkDiscounts: (params?: { orderAmount?: number; productIds?: string; categoryIds?: string; customerType?: string }) => {
    const qs = new URLSearchParams();
    if (params?.orderAmount) qs.set("orderAmount", String(params.orderAmount));
    if (params?.productIds) qs.set("productIds", params.productIds);
    if (params?.categoryIds) qs.set("categoryIds", params.categoryIds);
    if (params?.customerType) qs.set("customerType", params.customerType);
    return api.get<Discount[]>(`/api/promotions/discounts/check?${qs}`);
  },
};
