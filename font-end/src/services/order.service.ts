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
  shippingFee?: number;
  paymentMethod?: string;
  note?: string;
}

export interface Order {
  _id: string;
  order_id?: string;
  order_code?: string;
  status: string;
  total: number;
  total_amount?: number;
  subtotal?: number;
  shipping_fee?: number;
  shippingFee?: number;
  items: OrderItem[];
  order_items?: OrderItem[];
  createdAt?: string;
  created_at?: string;
  payment_status?: string;
  paymentStatus?: string;
  payment_method?: string;
  paymentMethod?: string;
  customer_name?: string;
  customerName?: string;
  order_type?: string;
  delivery_type?: string;
}

export interface PaymentInfo {
  payment?: { id: string; payment_method: string; total_amount: number };
  payUrl?: string;
  qrUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

export interface PaymentMethod {
  id: number;
  method_code: string;
  method_name: string;
  description?: string;
  is_active: boolean;
}

export const orderService = {
  checkout: (payload: CheckoutPayload) =>
    api.post<{ order: Order; paymentInfo?: PaymentInfo; message: string }>("/api/orders/checkout", payload),

  getMyOrders: () =>
    api.get<{ data: Order[]; pagination?: unknown }>("/api/orders/my-orders"),

  cancelOrder: (id: string) =>
    api.put<void>(`/api/orders/my-orders/${id}/cancel`, {}),

  getPaymentMethods: () =>
    api.get<{ data: PaymentMethod[] }>("/api/payments/methods"),

  getOrderById: (id: string) =>
    api.get<Order>(`/api/orders/${id}`),
};
