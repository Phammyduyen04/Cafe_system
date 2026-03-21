import { api } from "../lib/api";

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  toppings?: string[];
}

export interface CheckoutPayload {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    country: string;
  };
  shippingMethod: string;
  paymentMethod?: string;
  note?: string;
}

export interface Order {
  _id: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export const orderService = {
  checkout: (payload: CheckoutPayload) =>
    api.post<{ order: Order; message: string }>("/api/orders/checkout", payload),

  getMyOrders: () =>
    api.get<Order[]>("/api/orders/my-orders"),

  cancelOrder: (id: string) =>
    api.put<void>(`/api/orders/my-orders/${id}/cancel`, {}),
};
