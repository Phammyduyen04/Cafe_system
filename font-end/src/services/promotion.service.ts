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
  image?: string;
  benefitType: "BUY_X_GET_Y" | "FREE_ITEM" | "GIFT_WITH_ORDER";
  couponCode?: string | null;
  maxUsage?: number | null;
  usageCount?: number;
  status: "PLANNED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
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
  applicableCustomerTypes?: string[];
}

export interface Discount {
  discountId: string;
  discountName: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  description: string;
  image?: string;
  couponCode?: string | null;
  maxUsage?: number | null;
  usageCount?: number;
  status: "PLANNED" | "ACTIVE" | "EXPIRED" | "CANCELLED";
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

export interface UsageHistory {
  _id: string;
  programId: string;
  programType: "PROMOTION" | "DISCOUNT";
  orderId: string;
  customerId: string | null;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string;
}

export interface CalculateResult {
  type: "PROMOTION" | "DISCOUNT";
  program: Promotion | Discount;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  rewardProducts: { productId: string; quantity: number }[];
}

export const promotionService = {
  // ── Promotions ──
  getPromotions: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set("page", String(params.page));
    qs.set("limit", String(params?.limit ?? 10));
    if (params?.status) qs.set("status", params.status);
    return api.getRaw<{ data: Promotion[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/promotions?${qs}`
    );
  },

  getPromotionById: (id: string) =>
    api.get<Promotion>(`/api/promotions/${id}`),

  getPromotionByCoupon: (code: string) =>
    api.get<Promotion>(`/api/promotions/coupon/${encodeURIComponent(code)}`),

  uploadPromotionImage: (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    return api.upload<{ success: boolean; data: { url: string } }>("/api/promotions/upload/promotion", fd)
      .then((r) => r.data.url);
  },

  uploadDiscountImage: (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("image", file);
    return api.upload<{ success: boolean; data: { url: string } }>("/api/promotions/upload/discount", fd)
      .then((r) => r.data.url);
  },

  createPromotion: (data: {
    promotionName: string;
    description?: string;
    image?: string;
    benefitType: string;
    couponCode?: string;
    maxUsage?: number;
    startDate?: string;
    endDate?: string;
  }) => api.post<Promotion>("/api/promotions", data),

  updatePromotion: (id: string, data: Partial<Pick<Promotion, "promotionName" | "description" | "couponCode" | "maxUsage" | "endDate">>) =>
    api.put<Promotion>(`/api/promotions/${id}`, data),

  deletePromotion: (id: string) =>
    api.delete(`/api/promotions/${id}`),

  updatePromotionConditions: (id: string, data: Partial<PromotionCondition>) =>
    api.put(`/api/promotions/${id}/conditions`, data),

  checkPromotions: (params?: { productIds?: string; orderAmount?: number; categoryIds?: string; customerType?: string }) => {
    const qs = new URLSearchParams();
    if (params?.productIds) qs.set("productIds", params.productIds);
    if (params?.orderAmount) qs.set("orderAmount", String(params.orderAmount));
    if (params?.categoryIds) qs.set("categoryIds", params.categoryIds);
    if (params?.customerType) qs.set("customerType", params.customerType);
    return api.get<Promotion[]>(`/api/promotions/check?${qs}`);
  },

  // ── Discounts ──
  getDiscounts: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.set("page", String(params.page));
    qs.set("limit", String(params?.limit ?? 10));
    if (params?.status) qs.set("status", params.status);
    return api.getRaw<{ data: Discount[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/promotions/discounts?${qs}`
    );
  },

  getDiscountById: (id: string) =>
    api.get<Discount>(`/api/promotions/discounts/${id}`),

  getDiscountByCoupon: (code: string) =>
    api.get<Discount>(`/api/promotions/discounts/coupon/${encodeURIComponent(code)}`),

  createDiscount: (data: {
    discountName: string;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
    description?: string;
    image?: string;
    couponCode?: string;
    maxUsage?: number;
    startDate?: string;
    endDate?: string;
  }) => api.post<Discount>("/api/promotions/discounts", data),

  updateDiscount: (id: string, data: Partial<Pick<Discount, "discountName" | "description" | "discountType" | "discountValue" | "couponCode" | "maxUsage" | "endDate">>) =>
    api.put<Discount>(`/api/promotions/discounts/${id}`, data),

  deleteDiscount: (id: string) =>
    api.delete(`/api/promotions/discounts/${id}`),

  updateDiscountConditions: (id: string, data: Partial<DiscountCondition>) =>
    api.put(`/api/promotions/discounts/${id}/conditions`, data),

  checkDiscounts: (params?: { orderAmount?: number; productIds?: string; categoryIds?: string; customerType?: string }) => {
    const qs = new URLSearchParams();
    if (params?.orderAmount) qs.set("orderAmount", String(params.orderAmount));
    if (params?.productIds) qs.set("productIds", params.productIds);
    if (params?.categoryIds) qs.set("categoryIds", params.categoryIds);
    if (params?.customerType) qs.set("customerType", params.customerType);
    return api.get<Discount[]>(`/api/promotions/discounts/check?${qs}`);
  },

  // ── Calculate & Use ──
  calculate: (data: {
    type: "PROMOTION" | "DISCOUNT";
    programId: string;
    orderAmount: number;
    productIds?: string[];
    categoryIds?: string[];
    customerType?: string;
  }) => api.post<CalculateResult>("/api/promotions/calculate", data),

  recordUsage: (data: {
    type: "PROMOTION" | "DISCOUNT";
    programId: string;
    orderId: string;
    customerId?: string;
    originalAmount: number;
    discountAmount: number;
  }) => api.post<UsageHistory>("/api/promotions/use", data),

  // ── Usage History ──
  getUsageHistory: (programId: string, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return api.getRaw<{ data: UsageHistory[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/promotions/usage/${programId}?${qs}`
    );
  },
};
