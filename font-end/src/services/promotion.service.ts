import { api } from "../lib/api";

export interface Promotion {
  _id: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Discount {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  isActive: boolean;
}

export const promotionService = {
  getPromotions: () => api.get<Promotion[]>("/api/promotions"),

  getDiscounts: () => api.get<Discount[]>("/api/discounts"),

  checkPromotion: (params: { orderId?: string; total?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>);
    return api.get<Promotion[]>(`/api/promotions/check?${qs}`);
  },

  checkDiscount: (code: string, total?: number) => {
    const qs = new URLSearchParams({ code, ...(total ? { total: String(total) } : {}) });
    return api.get<Discount>(`/api/discounts/check?${qs}`);
  },
};
