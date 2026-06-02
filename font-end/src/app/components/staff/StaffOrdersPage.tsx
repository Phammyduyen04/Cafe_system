import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import {
  productService,
  type Product,
  type Category,
  type Topping,
  getProductImage,
} from "../../../services/product.service";
import type { Order, OrderItem, PaymentInfo } from "../../../services/order.service";

/* ─── Types ─────────────────────────────────────────────── */

interface CartItem {
  product: Product;
  size: string;
  sizePrice: number;
  quantity: number;
  toppings: Topping[];
}

type PayMethod = "CASH" | "BANK_TRANSFER" | "MOMO";

/* ─── Helpers ────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_PAYMENT: { bg: "#fff7ed", text: "#c2410c" },
  PENDING:         { bg: "#fef9c3", text: "#854d0e" },
  PAID:            { bg: "#dcfce7", text: "#166534" },
  CONFIRMED:       { bg: "#dbeafe", text: "#1e40af" },
  PREPARING:       { bg: "#ede9fe", text: "#6d28d9" },
  READY:           { bg: "#dcfce7", text: "#166534" },
  COMPLETED:       { bg: "#f3f4f6", text: "#4b5563" },
  CANCELLED:       { bg: "#fef2f2", text: "#dc2626" },
  DELIVERING:      { bg: "#ffedd5", text: "#9a3412" },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING:         "Chờ xác nhận",
  PAID:            "Đã thanh toán",
  CONFIRMED:       "Đã xác nhận",
  PREPARING:       "Đang pha chế",
  READY:           "Sẵn sàng",
  COMPLETED:       "Hoàn thành",
  CANCELLED:       "Đã hủy",
  DELIVERING:      "Đang giao",
};

// Online paid (VNPAY/MoMo): PAID → CONFIRMED
// Cash pending: PENDING_PAYMENT → PAID (thu tiền)
// Normal flow: PENDING → CONFIRMED → PREPARING → READY → COMPLETED
const NEXT_STATUS: Record<string, string> = {
  PAID:      "CONFIRMED",
  PENDING:   "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY:     "COMPLETED",
};

const NEXT_LABEL: Record<string, string> = {
  PAID:      "Xác nhận & pha chế",
  PENDING:   "Xác nhận đơn",
  CONFIRMED: "Bắt đầu pha chế",
  PREPARING: "Đã sẵn sàng",
  READY:     "Hoàn tất",
};

const PAYMENT_METHOD_LABELS: Record<string, { label: string; color: string }> = {
  CASH:          { label: "Tiền mặt",    color: "#d97706" },
  VNPAY:         { label: "VNPay",       color: "#005baa" },
  MOMO:          { label: "MoMo",        color: "#a50064" },
  QR:            { label: "QR Code",     color: "#16a34a" },
  BANK_TRANSFER: { label: "Chuyển khoản",color: "#0369a1" },
};

/* ─── Main component ─────────────────────────────────────── */

export default function StaffOrdersPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "pos">("orders");

  return (
    <div>
      <h1
        className="font-heading text-[var(--cafe-primary)] mb-6"
        style={{ fontSize: 28, fontWeight: 700 }}
      >
        Nhận đơn & Thu ngân
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[var(--cafe-border)] w-fit mb-6">
        {(
          [
            { key: "orders", label: "Đơn của khách", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { key: "pos", label: "Tạo đơn tại quầy", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--cafe-primary)] text-white"
                : "text-[var(--cafe-primary)]/60 hover:text-[var(--cafe-primary)] hover:bg-[var(--cafe-bg)]"
            }`}
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "orders" ? <OrdersTab /> : <PosTab />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 1 — Danh sách đơn
══════════════════════════════════════════════════════════ */

/* helper: resolve order key from multiple possible field names */
function orderId(order: Order) {
  return order._id ?? order.order_id ?? "";
}
function orderItems(order: Order): OrderItem[] {
  if (order.items?.length) return order.items;
  if (order.order_items?.length) return order.order_items;
  return (order.order_details ?? []).map((d) => ({
    productId: d.product_id ?? "",
    name: d.product_name ?? "",
    size: d.size ?? "",
    quantity: d.quantity ?? 0,
    price: Number(d.unit_price ?? 0),
    toppings: (d.toppings ?? []).map((t) => t.topping_name ?? t.name ?? ""),
  }));
}
function orderDate(order: Order) {
  const raw = order.createdAt ?? order.created_at ?? "";
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}
function orderShippingFee(order: Order) {
  return order.shipping_fee ?? order.shippingFee ?? 0;
}

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PAID:    { label: "Đã thanh toán", color: "#16a34a" },
  PENDING: { label: "Chờ thanh toán", color: "#d97706" },
  FAILED:  { label: "Thất bại",       color: "#dc2626" },
  REFUNDED:{ label: "Đã hoàn tiền",   color: "#7c3aed" },
};

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      if (filterStatus) qs.set("status", filterStatus);
      qs.set("limit", "50");
      const res = await api.getRaw<any>(`/api/orders?${qs}`);
      const list: Order[] = Array.isArray(res)
        ? res
        : res?.data ?? res?.orders ?? [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleUpdateStatus = async (order: Order, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = orderId(order);
    try {
      setUpdating(id + newStatus);
      await api.put(`/api/orders/${id}/status`, { status: newStatus });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xác nhận huỷ đơn này?")) return;
    const id = orderId(order);
    try {
      setUpdating(id + "CANCELLED");
      await api.put(`/api/orders/${id}/status`, { status: "CANCELLED" });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || "Không thể huỷ đơn");
    } finally {
      setUpdating(null);
    }
  };

  const statusFilters = [
    { value: "",          label: "Tất cả" },
    { value: "PENDING",   label: "Chờ xác nhận" },
    { value: "PAID",            label: "Đã thanh toán" },
    { value: "CONFIRMED",       label: "Đã xác nhận" },
    { value: "PREPARING",       label: "Đang pha chế" },
    { value: "READY",           label: "Sẵn sàng" },
    { value: "COMPLETED",       label: "Hoàn thành" },
  ];

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilterStatus(f.value); setExpandedId(null); }}
            className={`font-body px-3 py-1.5 rounded-lg border transition-colors ${
              filterStatus === f.value
                ? "bg-[var(--cafe-primary)] text-white border-transparent"
                : "bg-white text-[var(--cafe-primary)]/70 border-[var(--cafe-border)] hover:border-[var(--cafe-primary)]/30"
            }`}
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={loadOrders}
          className="font-body px-3 py-1.5 rounded-lg border border-[var(--cafe-border)] bg-white text-[var(--cafe-primary)]/70 hover:bg-[var(--cafe-bg)] transition-colors ml-auto"
          style={{ fontSize: 12 }}
        >
          ↻ Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>
            Không có đơn nào
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => {
            const oid = orderId(order);
            const sc = ORDER_STATUS_COLORS[order.status] ?? ORDER_STATUS_COLORS.PENDING;
            const items = orderItems(order);
            const shippingFee = orderShippingFee(order);
            const total = order.total_amount ?? order.total ?? 0;
            const payMethod = (order.payment_method ?? order.paymentMethod ?? "").toUpperCase();
            const pmInfo = PAYMENT_METHOD_LABELS[payMethod];
            const isOnlinePayment = payMethod === "VNPAY" || payMethod === "MOMO";
            const isCashPending = order.status === "PENDING_PAYMENT" && payMethod === "CASH";
            const nextStatus = NEXT_STATUS[order.status];
            const canCancel = ["PENDING_PAYMENT", "PENDING", "PAID", "CONFIRMED"].includes(order.status);
            const isExpanded = expandedId === oid;

            return (
              <div
                key={oid}
                className={`bg-white rounded-2xl border transition-colors ${isExpanded ? "border-[var(--cafe-gold)]/60" : "border-[var(--cafe-border)] hover:border-[var(--cafe-gold)]/40"}`}
              >
                {/* Header row — clickable */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : oid)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>
                          #{order.order_code ?? oid.slice(-8).toUpperCase()}
                        </span>
                        {/* Order status */}
                        <span className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.text }}>
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                        {/* Payment method badge */}
                        {pmInfo && (
                          <span className="font-body px-2 py-0.5 rounded-full border" style={{ fontSize: 10, fontWeight: 600, color: pmInfo.color, borderColor: pmInfo.color + "40", backgroundColor: pmInfo.color + "12" }}>
                            {pmInfo.label}
                          </span>
                        )}
                        {/* Cash pending indicator */}
                        {isCashPending && (
                          <span className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, color: "#92400e", backgroundColor: "#fef3c7", border: "1px dashed #d97706" }}>
                            Chưa thu tiền
                          </span>
                        )}
                        {/* Online paid indicator */}
                        {order.status === "PAID" && isOnlinePayment && (
                          <span className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, color: "#166534", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            Thanh toán online ✓
                          </span>
                        )}
                      </div>
                      <p className="font-body text-[var(--cafe-primary)]/50 mt-0.5" style={{ fontSize: 12 }}>
                        {items.length} sản phẩm · {orderDate(order)}
                        {(order.customer_name || order.customerName) && (
                          <span className="ml-1">· {order.customer_name ?? order.customerName}</span>
                        )}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 700 }}>
                        {fmt(total)}
                      </p>
                      <div className="flex gap-1.5 justify-end mt-1 flex-wrap">
                        {/* Cash pending: thu tiền trước khi xử lý */}
                        {isCashPending && (
                          <button
                            onClick={(e) => handleUpdateStatus(order, "PAID", e)}
                            disabled={updating === oid + "PAID"}
                            className="font-body px-3 py-1 rounded-lg text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                            style={{ fontSize: 11, fontWeight: 600, backgroundColor: "#d97706" }}
                          >
                            {updating === oid + "PAID" ? "..." : "Thu tiền mặt"}
                          </button>
                        )}
                        {/* Normal next-step button (skip for cash pending — must collect first) */}
                        {nextStatus && !isCashPending && (
                          <button
                            onClick={(e) => handleUpdateStatus(order, nextStatus, e)}
                            disabled={updating === oid + nextStatus}
                            className="font-body px-3 py-1 bg-[var(--cafe-gold)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            {updating === oid + nextStatus ? "..." : NEXT_LABEL[order.status]}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={(e) => handleCancel(order, e)}
                            disabled={updating === oid + "CANCELLED"}
                            className="font-body px-3 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                            style={{ fontSize: 11, fontWeight: 600 }}
                          >
                            {updating === oid + "CANCELLED" ? "..." : "Huỷ"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[var(--cafe-bg)]">
                    <div className="mt-3 space-y-2">
                      {items.length === 0 ? (
                        <p className="font-body text-[var(--cafe-primary)]/40 text-sm py-2">Không có thông tin sản phẩm</p>
                      ) : items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start">
                          <div>
                            <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                              {item.name}
                            </span>
                            {item.size && (
                              <span className="font-body text-[var(--cafe-primary)]/50 ml-1" style={{ fontSize: 11 }}>
                                ({item.size})
                              </span>
                            )}
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 11 }}>
                                + {item.toppings.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="font-body text-[var(--cafe-primary)]/70 shrink-0 ml-4" style={{ fontSize: 12 }}>
                            x{item.quantity} · {fmt(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-3 pt-3 border-t border-[var(--cafe-bg)] space-y-1.5">
                      {shippingFee > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 12 }}>Tiền hàng</span>
                            <span className="font-body text-[var(--cafe-primary)]/80" style={{ fontSize: 12 }}>{fmt(total - shippingFee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 12 }}>Phí vận chuyển</span>
                            <span className="font-body text-[var(--cafe-primary)]/80" style={{ fontSize: 12 }}>{fmt(shippingFee)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between pt-1">
                        <span className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>Tổng cộng</span>
                        <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 700 }}>{fmt(total)}</span>
                      </div>
                    </div>

                    {/* Payment & delivery info */}
                    <div className="mt-3 pt-3 border-t border-[var(--cafe-bg)] flex flex-wrap gap-4">
                      {payMethod && (
                        <div>
                          <p className="font-body" style={{ fontSize: 10, color: "rgba(48,38,28,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phương thức</p>
                          <p className="font-body" style={{ fontSize: 12, fontWeight: 600, color: pmInfo?.color ?? "var(--cafe-primary)" }}>
                            {pmInfo?.label ?? payMethod}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-body" style={{ fontSize: 10, color: "rgba(48,38,28,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Trạng thái TT</p>
                        <p className="font-body" style={{ fontSize: 12, fontWeight: 600, color: isCashPending ? "#d97706" : isOnlinePayment && order.status === "PAID" ? "#16a34a" : "var(--cafe-primary)" }}>
                          {isCashPending
                            ? "Chưa thu tiền"
                            : isOnlinePayment && order.status === "PAID"
                              ? "Đã thanh toán online"
                              : order.status === "PAID" || ["CONFIRMED","PREPARING","READY","COMPLETED"].includes(order.status)
                                ? "Đã thanh toán"
                                : "Chờ thanh toán"}
                        </p>
                      </div>
                      {(order.order_type ?? order.delivery_type) && (
                        <div>
                          <p className="font-body" style={{ fontSize: 10, color: "rgba(48,38,28,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Loại đơn</p>
                          <p className="font-body" style={{ fontSize: 12, color: "var(--cafe-primary)", fontWeight: 600 }}>{order.order_type ?? order.delivery_type}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2 — POS / Tạo đơn tại quầy
══════════════════════════════════════════════════════════ */

function PosTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");

  // Product detail modal
  const [pickedProduct, setPickedProduct] = useState<Product | null>(null);
  const [pickedSize, setPickedSize] = useState("");
  const [pickedToppings, setPickedToppings] = useState<Topping[]>([]);
  const [pickedQty, setPickedQty] = useState(1);

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [payError, setPayError] = useState("");
  // Track auto-created order for digital methods (for cancellation on "Quay lại")
  const [autoOrderId, setAutoOrderId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      productService.getProducts({ all: true }),
      productService.getCategories(true),
      productService.getToppings(true),
    ]).then(([prods, cats, tops]) => {
      setProducts(prods.filter((p) => p.status === "ACTIVE" || p.isAvailable));
      setCategories(cats.filter((c) => c.status === "ACTIVE"));
      setToppings(tops.filter((t) => t.status === "ACTIVE" || t.isAvailable));
      setLoading(false);
    });
  }, []);

  /* Cart helpers */
  const cartTotal = cart.reduce((sum, item) => {
    const toppingCost = item.toppings.reduce((s, t) => s + t.price, 0);
    return sum + (item.sizePrice + toppingCost) * item.quantity;
  }, 0);

  const addToCart = () => {
    if (!pickedProduct) return;
    const sizeObj = pickedProduct.sizes?.find((s) => s.label === pickedSize);
    const basePrice = pickedProduct.price + (sizeObj?.additionalPrice ?? 0);
    const toppingKey = pickedToppings.map((t) => t._id).sort().join(",");

    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.product._id === pickedProduct._id &&
          c.size === pickedSize &&
          c.toppings.map((t) => t._id).sort().join(",") === toppingKey
      );
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + pickedQty } : c
        );
      }
      return [
        ...prev,
        {
          product: pickedProduct,
          size: pickedSize,
          sizePrice: basePrice,
          quantity: pickedQty,
          toppings: pickedToppings,
        },
      ];
    });
    setPickedProduct(null);
    setPickedToppings([]);
    setPickedQty(1);
  };

  const removeCartItem = (idx: number) =>
    setCart((prev) => prev.filter((_, i) => i !== idx));

  const updateQty = (idx: number, delta: number) =>
    setCart((prev) =>
      prev
        .map((c, i) =>
          i === idx ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c
        )
        .filter((c) => c.quantity > 0)
    );

  const openPickProduct = (product: Product) => {
    setPickedProduct(product);
    const firstSize = product.sizes?.[0]?.label ?? "";
    setPickedSize(firstSize);
    setPickedToppings([]);
    setPickedQty(1);
  };

  const toggleTopping = (t: Topping) =>
    setPickedToppings((prev) =>
      prev.find((x) => x._id === t._id)
        ? prev.filter((x) => x._id !== t._id)
        : [...prev, t]
    );

  /* Checkout — accepts explicit method to avoid stale closure */
  const handleCheckout = async (method: PayMethod = payMethod) => {
    if (cart.length === 0) return;
    setPayError("");
    setPaying(true);
    try {
      const res = await api.post<{
        order: Order;
        paymentInfo?: PaymentInfo;
        message: string;
      }>("/api/orders", {
        orderType: "DINE_IN",
        orderChannel: "IN_STORE",
        paymentMethod: method === "BANK_TRANSFER" ? "VNPAY" : method,
        note: customerName ? `Khách: ${customerName}` : "Đơn tại quầy",
        items: cart.map((c) => ({
          productId: c.product._id,
          productName: c.product.name,
          size: c.size || null,
          unitPrice: c.sizePrice,
          quantity: c.quantity,
          toppings: c.toppings.map((t) => ({
            toppingName: t.name,
            toppingPrice: t.price ?? 0,
            quantity: 1,
          })),
        })),
      });
      const oid = (res as any)?.order_id ?? (res as any)?.order?.order_id ?? null;
      setAutoOrderId(oid);
      setPaymentInfo(res.paymentInfo ?? null);
      setOrderSuccess(true);
    } catch (err: any) {
      setPayError(err.message || "Tạo đơn thất bại, vui lòng thử lại.");
    } finally {
      setPaying(false);
    }
  };

  /* Switch digital payment method — cancel previous auto-order then re-generate */
  const handleSelectDigitalMethod = async (method: PayMethod) => {
    if (paying) return;
    // Cancel the previously auto-created order (if any)
    if (autoOrderId) {
      api.put(`/api/orders/${autoOrderId}/status`, { status: "CANCELLED" }).catch(() => {});
    }
    setAutoOrderId(null);
    setPaymentInfo(null);
    setOrderSuccess(false);
    setPayError("");
    setPayMethod(method);
    // Auto-generate real QR immediately
    await handleCheckout(method);
  };

  const resetOrder = () => {
    setCart([]);
    setCustomerName("");
    setShowPayment(false);
    setOrderSuccess(false);
    setPaymentInfo(null);
    setPayError("");
    setCashReceived("");
    setPayMethod("CASH");
    setAutoOrderId(null);
  };

  /* Quay lại — huỷ đơn đã auto-tạo nếu là digital payment */
  const handleBack = () => {
    if (autoOrderId) {
      api.put(`/api/orders/${autoOrderId}/status`, { status: "CANCELLED" }).catch(() => {});
      setAutoOrderId(null);
    }
    setPaymentInfo(null);
    setOrderSuccess(false);
    setPayError("");
    setShowPayment(false);
    setPayMethod("CASH");
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = !activeCategory || (
      (typeof p.category === "object" ? p.category?.categoryId : p.category) === activeCategory ||
      p.productCategoryId === activeCategory
    );
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cashChange =
    payMethod === "CASH" && cashReceived
      ? parseFloat(cashReceived.replace(/\D/g, "")) - cartTotal
      : null;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* ── Left: Product catalog ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-[var(--cafe-bg)]">
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-body w-full px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] bg-[var(--cafe-bg)]"
            style={{ fontSize: 13 }}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-3 py-2 border-b border-[var(--cafe-bg)] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveCategory("")}
            className={`font-body shrink-0 px-3 py-1 rounded-lg border transition-colors ${
              !activeCategory
                ? "bg-[var(--cafe-primary)] text-white border-transparent"
                : "border-[var(--cafe-border)] text-[var(--cafe-primary)]/60 hover:border-[var(--cafe-primary)]/30"
            }`}
            style={{ fontSize: 12 }}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.categoryId}
              onClick={() => setActiveCategory(c.categoryId)}
              className={`font-body shrink-0 px-3 py-1 rounded-lg border transition-colors ${
                activeCategory === c.categoryId
                  ? "bg-[var(--cafe-primary)] text-white border-transparent"
                  : "border-[var(--cafe-border)] text-[var(--cafe-primary)]/60 hover:border-[var(--cafe-primary)]/30"
              }`}
              style={{ fontSize: 12 }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredProducts.map((product) => (
              <button
                key={product._id}
                onClick={() => openPickProduct(product)}
                className="text-left bg-[var(--cafe-bg)] hover:bg-[var(--cafe-gold)]/10 rounded-xl p-2 border border-transparent hover:border-[var(--cafe-gold)]/40 transition-colors"
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-lg mb-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3C/svg%3E";
                  }}
                />
                <p
                  className="font-body text-[var(--cafe-primary)] truncate"
                  style={{ fontSize: 12, fontWeight: 500 }}
                >
                  {product.name}
                </p>
                <p
                  className="font-body text-[var(--cafe-gold)]"
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  {fmt(product.price)}
                </p>
              </button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <p
              className="font-body text-[var(--cafe-primary)]/40 text-center py-10"
              style={{ fontSize: 13 }}
            >
              Không tìm thấy sản phẩm
            </p>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="w-72 xl:w-80 flex flex-col bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden shrink-0">
        <div className="px-4 py-3 border-b border-[var(--cafe-bg)]">
          <p
            className="font-heading text-[var(--cafe-primary)]"
            style={{ fontSize: 16, fontWeight: 700 }}
          >
            Đơn hàng
          </p>
          <input
            type="text"
            placeholder="Tên khách (tùy chọn)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="font-body mt-2 w-full px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] bg-[var(--cafe-bg)]"
            style={{ fontSize: 12 }}
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {cart.length === 0 ? (
            <p
              className="font-body text-[var(--cafe-primary)]/40 text-center py-10"
              style={{ fontSize: 13 }}
            >
              Chưa có sản phẩm
            </p>
          ) : (
            <div className="space-y-3">
              {cart.map((item, idx) => {
                const toppingCost = item.toppings.reduce(
                  (s, t) => s + t.price,
                  0
                );
                const lineTotal =
                  (item.sizePrice + toppingCost) * item.quantity;
                return (
                  <div
                    key={idx}
                    className="pb-3 border-b border-[var(--cafe-bg)] last:border-0"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-body text-[var(--cafe-primary)] truncate"
                          style={{ fontSize: 12, fontWeight: 600 }}
                        >
                          {item.product.name}
                        </p>
                        {item.size && (
                          <p
                            className="font-body text-[var(--cafe-primary)]/50"
                            style={{ fontSize: 10 }}
                          >
                            {item.size}
                          </p>
                        )}
                        {item.toppings.length > 0 && (
                          <p
                            className="font-body text-[var(--cafe-primary)]/40"
                            style={{ fontSize: 10 }}
                          >
                            +{item.toppings.map((t) => t.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeCartItem(idx)}
                        className="text-[var(--cafe-red)]/60 hover:text-[var(--cafe-red)] shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="w-6 h-6 rounded-md border border-[var(--cafe-border)] flex items-center justify-center hover:bg-[var(--cafe-bg)] transition-colors"
                          style={{ fontSize: 14 }}
                        >
                          −
                        </button>
                        <span
                          className="font-body text-[var(--cafe-primary)] w-5 text-center"
                          style={{ fontSize: 12 }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="w-6 h-6 rounded-md border border-[var(--cafe-border)] flex items-center justify-center hover:bg-[var(--cafe-bg)] transition-colors"
                          style={{ fontSize: 14 }}
                        >
                          +
                        </button>
                      </div>
                      <span
                        className="font-body text-[var(--cafe-primary)]"
                        style={{ fontSize: 12, fontWeight: 700 }}
                      >
                        {fmt(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total + checkout */}
        <div className="px-4 py-3 border-t border-[var(--cafe-bg)]">
          <div className="flex justify-between mb-3">
            <span
              className="font-body text-[var(--cafe-primary)]/60"
              style={{ fontSize: 13 }}
            >
              Tổng cộng
            </span>
            <span
              className="font-heading text-[var(--cafe-primary)]"
              style={{ fontSize: 18, fontWeight: 700 }}
            >
              {fmt(cartTotal)}
            </span>
          </div>
          <button
            onClick={() => {
              if (cart.length > 0) setShowPayment(true);
            }}
            disabled={cart.length === 0}
            className="font-body w-full py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            Thanh toán
          </button>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="font-body w-full py-2 mt-1 text-[var(--cafe-red)]/70 hover:text-[var(--cafe-red)] transition-colors"
              style={{ fontSize: 12 }}
            >
              Hủy đơn
            </button>
          )}
        </div>
      </div>

      {/* ── Product picker modal ── */}
      {pickedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPickedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <img
                src={getProductImage(pickedProduct)}
                alt={pickedProduct.name}
                className="w-16 h-16 object-cover rounded-xl"
              />
              <div>
                <h3
                  className="font-heading text-[var(--cafe-primary)]"
                  style={{ fontSize: 18, fontWeight: 700 }}
                >
                  {pickedProduct.name}
                </h3>
                <p
                  className="font-body text-[var(--cafe-gold)]"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  {fmt(pickedProduct.price)}
                </p>
              </div>
            </div>

            {/* Size */}
            {pickedProduct.sizes && pickedProduct.sizes.length > 0 && (
              <div className="mb-4">
                <p
                  className="font-body text-[var(--cafe-primary)] mb-2"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Kích cỡ
                </p>
                <div className="flex gap-2 flex-wrap">
                  {pickedProduct.sizes.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setPickedSize(s.label)}
                      className={`font-body px-3 py-1.5 rounded-lg border transition-colors ${
                        pickedSize === s.label
                          ? "bg-[var(--cafe-primary)] text-white border-transparent"
                          : "border-[var(--cafe-border)] text-[var(--cafe-primary)]/70 hover:border-[var(--cafe-primary)]/40"
                      }`}
                      style={{ fontSize: 12 }}
                    >
                      {s.label}
                      {s.additionalPrice
                        ? ` (+${fmt(s.additionalPrice)})`
                        : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toppings */}
            {toppings.length > 0 && (
              <div className="mb-4">
                <p
                  className="font-body text-[var(--cafe-primary)] mb-2"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Topping
                </p>
                <div className="space-y-1.5">
                  {toppings.map((t) => {
                    const checked = pickedToppings.some((x) => x._id === t._id);
                    return (
                      <label
                        key={t._id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors"
                        style={{
                          borderColor: checked
                            ? "var(--cafe-gold)"
                            : "var(--cafe-border)",
                          backgroundColor: checked ? "#fffbeb" : "white",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTopping(t)}
                            className="accent-[var(--cafe-gold)]"
                          />
                          <span
                            className="font-body text-[var(--cafe-primary)]"
                            style={{ fontSize: 13 }}
                          >
                            {t.name}
                          </span>
                        </span>
                        <span
                          className="font-body text-[var(--cafe-primary)]/60"
                          style={{ fontSize: 12 }}
                        >
                          +{fmt(t.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center justify-between mb-4">
              <p
                className="font-body text-[var(--cafe-primary)]"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                Số lượng
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPickedQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-[var(--cafe-border)] flex items-center justify-center hover:bg-[var(--cafe-bg)]"
                  style={{ fontSize: 18 }}
                >
                  −
                </button>
                <span
                  className="font-body text-[var(--cafe-primary)] w-6 text-center"
                  style={{ fontSize: 15, fontWeight: 600 }}
                >
                  {pickedQty}
                </span>
                <button
                  onClick={() => setPickedQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg border border-[var(--cafe-border)] flex items-center justify-center hover:bg-[var(--cafe-bg)]"
                  style={{ fontSize: 18 }}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPickedProduct(null)}
                className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={addToCart}
                className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 flex flex-col" style={{ maxHeight: "92vh" }}>
            {orderSuccess ? (
              /* Success screen */
              <div className="text-center p-6 py-8">
                {/* VNPAY QR (BANK_TRANSFER) */}
                {payMethod === "BANK_TRANSFER" && paymentInfo?.payUrl && (
                  <>
                    <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 20, fontWeight: 700 }}>
                      Chờ khách thanh toán
                    </h2>
                    <p className="font-body text-[var(--cafe-primary)]/60 mb-3" style={{ fontSize: 13 }}>
                      Cho khách quét mã QR qua app ngân hàng
                    </p>
                    <p className="font-heading mb-4" style={{ fontSize: 22, fontWeight: 700, color: "var(--cafe-gold)" }}>
                      {fmt(cartTotal)}
                    </p>
                    <div
                      className="rounded-2xl p-4 mb-4 flex flex-col items-center gap-3 mx-auto"
                      style={{ background: "linear-gradient(135deg, #005baa 0%, #0079cf 100%)", maxWidth: 260 }}
                    >
                      <span className="font-heading text-white" style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>VNPay</span>
                      <div className="bg-white rounded-xl p-2">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentInfo.payUrl)}`}
                          alt="QR VNPAY"
                          className="w-44 h-44 rounded-lg"
                        />
                      </div>
                      <p className="font-body text-white/80" style={{ fontSize: 11 }}>Quét bằng app ngân hàng bất kỳ</p>
                    </div>
                  </>
                )}

                {/* MoMo QR */}
                {payMethod === "MOMO" && (paymentInfo?.qrCodeUrl || paymentInfo?.payUrl) && (
                  <>
                    <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 20, fontWeight: 700 }}>
                      Chờ khách thanh toán
                    </h2>
                    <p className="font-body text-[var(--cafe-primary)]/60 mb-3" style={{ fontSize: 13 }}>
                      Cho khách quét mã QR qua ứng dụng MoMo
                    </p>
                    <p className="font-heading mb-4" style={{ fontSize: 22, fontWeight: 700, color: "var(--cafe-gold)" }}>
                      {fmt(cartTotal)}
                    </p>
                    <div
                      className="rounded-2xl p-4 mb-4 flex flex-col items-center gap-3 mx-auto"
                      style={{ background: "linear-gradient(135deg, #a50064 0%, #d82d8b 100%)", maxWidth: 260 }}
                    >
                      <span className="font-heading text-white" style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>MoMo</span>
                      <div className="bg-white rounded-xl p-2">
                        {/* qrCodeUrl là momo:// deep link — encode thành QR image để MoMo app quét trực tiếp */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                            paymentInfo.qrCodeUrl ?? paymentInfo.payUrl!
                          )}`}
                          alt="QR MoMo"
                          className="w-44 h-44 rounded-lg"
                        />
                      </div>
                      <p className="font-body text-white/80" style={{ fontSize: 11 }}>Quét bằng ứng dụng MoMo</p>
                    </div>
                  </>
                )}

                {/* CASH success */}
                {payMethod === "CASH" && (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <h2 className="font-heading text-[var(--cafe-primary)] mb-2" style={{ fontSize: 22, fontWeight: 700 }}>
                      Thanh toán thành công!
                    </h2>
                    <p className="font-body text-[var(--cafe-primary)]/60 mb-2" style={{ fontSize: 14 }}>
                      Đơn hàng đã được tạo
                    </p>
                    <p className="font-heading text-[var(--cafe-gold)] mb-4" style={{ fontSize: 24, fontWeight: 700 }}>
                      {fmt(cartTotal)}
                    </p>
                    {cashReceived && Number(cashReceived.replace(/\D/g, "")) > cartTotal && (
                      <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
                        <p className="font-body text-green-700" style={{ fontSize: 14 }}>
                          Tiền thối: <strong>{fmt(Number(cashReceived.replace(/\D/g, "")) - cartTotal)}</strong>
                        </p>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={resetOrder}
                  className="font-body w-full py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 mt-2"
                  style={{ fontSize: 14, fontWeight: 600 }}
                >
                  Tạo đơn mới
                </button>
              </div>
            ) : (
              <>
                {/* ── Fixed header: title + total + method tabs ── */}
                <div className="px-6 pt-5 pb-4 border-b border-[var(--cafe-bg)]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2
                        className="font-heading text-[var(--cafe-primary)]"
                        style={{ fontSize: 20, fontWeight: 700 }}
                      >
                        Thanh toán
                      </h2>
                      <p
                        className="font-body text-[var(--cafe-primary)]/50"
                        style={{ fontSize: 12 }}
                      >
                        {customerName || "Khách tại quầy"} · {cart.length} sản phẩm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>Tổng tiền</p>
                      <p
                        className="font-heading text-[var(--cafe-primary)]"
                        style={{ fontSize: 22, fontWeight: 700 }}
                      >
                        {fmt(cartTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Method selector tabs — always visible */}
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          key: "CASH" as PayMethod,
                          label: "Tiền mặt",
                          icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
                        },
                        {
                          key: "BANK_TRANSFER" as PayMethod,
                          label: "Chuyển khoản",
                          icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                        },
                        {
                          key: "MOMO" as PayMethod,
                          label: "QR / Ví",
                          icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
                        },
                      ]
                    ).map((m) => {
                      const active = payMethod === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() =>
                            m.key === "CASH"
                              ? setPayMethod("CASH")
                              : handleSelectDigitalMethod(m.key)
                          }
                          disabled={paying}
                          className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all disabled:opacity-50"
                          style={{
                            borderColor: active ? "var(--cafe-primary)" : "var(--cafe-border)",
                            backgroundColor: active ? "var(--cafe-primary)" : "white",
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={active ? "white" : "var(--cafe-primary)"}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={m.icon} />
                          </svg>
                          <span
                            className="font-body text-center"
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: active ? "white" : "var(--cafe-primary)",
                            }}
                          >
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Scrollable method-specific content ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">

                  {/* CASH */}
                  {payMethod === "CASH" && (
                    <div>
                      <p className="font-body text-[var(--cafe-primary)]/60 mb-3" style={{ fontSize: 12 }}>
                        Nhập số tiền khách đưa để tính tiền thối
                      </p>
                      <label
                        className="font-body text-[var(--cafe-primary)] block mb-2"
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        Tiền khách đưa
                      </label>
                      <input
                        type="number"
                        placeholder={String(cartTotal)}
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="font-body w-full px-4 py-3 border-2 border-[var(--cafe-border)] rounded-xl focus:outline-none focus:border-[var(--cafe-primary)] bg-[var(--cafe-bg)]"
                        style={{ fontSize: 18, fontWeight: 600 }}
                        autoFocus
                      />
                      <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: cashChange === null ? "#f9fafb" : cashChange >= 0 ? "#f0fdf4" : "#fef2f2" }}>
                        {cashChange === null && (
                          <p className="font-body text-center" style={{ fontSize: 13, color: "var(--cafe-primary)", opacity: 0.4 }}>
                            Nhập tiền khách đưa để tính tiền thối
                          </p>
                        )}
                        {cashChange !== null && cashChange >= 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-body text-green-700" style={{ fontSize: 13 }}>Tiền thối</span>
                            <span className="font-heading text-green-700" style={{ fontSize: 20, fontWeight: 700 }}>{fmt(cashChange)}</span>
                          </div>
                        )}
                        {cashChange !== null && cashChange < 0 && (
                          <div className="flex justify-between items-center">
                            <span className="font-body text-red-600" style={{ fontSize: 13 }}>Còn thiếu</span>
                            <span className="font-heading text-red-600" style={{ fontSize: 20, fontWeight: 700 }}>{fmt(Math.abs(cashChange))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BANK TRANSFER → VNPAY: show real QR immediately */}
                  {payMethod === "BANK_TRANSFER" && (
                    <div className="text-center">
                      {paying ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                          <div className="w-8 h-8 border-4 border-[#005baa] border-t-transparent rounded-full animate-spin" />
                          <p className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>Đang tạo mã QR VNPAY...</p>
                        </div>
                      ) : paymentInfo?.payUrl ? (
                        <>
                          <p className="font-body text-[var(--cafe-primary)]/60 mb-3" style={{ fontSize: 12 }}>
                            Cho khách quét mã QR qua app ngân hàng
                          </p>
                          <div
                            className="rounded-2xl p-4 mb-3 flex flex-col items-center gap-3 mx-auto"
                            style={{ background: "linear-gradient(135deg, #005baa 0%, #0079cf 100%)", maxWidth: 260 }}
                          >
                            <span className="font-heading text-white" style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>VNPay</span>
                            <div className="bg-white rounded-xl p-2">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentInfo.payUrl)}`}
                                alt="QR VNPAY"
                                className="w-44 h-44 rounded-lg"
                              />
                            </div>
                            <p className="font-heading text-white" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(cartTotal)}</p>
                            <p className="font-body text-white/80" style={{ fontSize: 11 }}>Quét bằng app ngân hàng bất kỳ</p>
                          </div>
                        </>
                      ) : payError ? (
                        <div className="py-6">
                          <p className="font-body text-red-500 mb-3" style={{ fontSize: 13 }}>{payError}</p>
                          <button
                            onClick={() => handleSelectDigitalMethod("BANK_TRANSFER")}
                            className="font-body px-4 py-2 border border-[var(--cafe-primary)] text-[var(--cafe-primary)] rounded-lg"
                            style={{ fontSize: 12 }}
                          >Thử lại</button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* MOMO: show real QR immediately */}
                  {payMethod === "MOMO" && (
                    <div className="text-center">
                      {paying ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                          <div className="w-8 h-8 border-4 border-[#a50064] border-t-transparent rounded-full animate-spin" />
                          <p className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>Đang tạo mã QR MoMo...</p>
                        </div>
                      ) : (paymentInfo?.qrCodeUrl || paymentInfo?.payUrl) ? (
                        <>
                          <p className="font-body text-[var(--cafe-primary)]/60 mb-3" style={{ fontSize: 12 }}>
                            Cho khách quét mã QR qua ứng dụng MoMo
                          </p>
                          <div
                            className="rounded-2xl p-4 mb-3 flex flex-col items-center gap-3 mx-auto"
                            style={{ background: "linear-gradient(135deg, #a50064 0%, #d82d8b 100%)", maxWidth: 260 }}
                          >
                            <span className="font-heading text-white" style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>MoMo</span>
                            <div className="bg-white rounded-xl p-2">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                  paymentInfo.qrCodeUrl ?? paymentInfo.payUrl!
                                )}`}
                                alt="QR MoMo"
                                className="w-44 h-44 rounded-lg"
                              />
                            </div>
                            <p className="font-heading text-white" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(cartTotal)}</p>
                            <p className="font-body text-white/80" style={{ fontSize: 11 }}>Quét bằng ứng dụng MoMo</p>
                          </div>
                        </>
                      ) : payError ? (
                        <div className="py-6">
                          <p className="font-body text-red-500 mb-3" style={{ fontSize: 13 }}>{payError}</p>
                          <button
                            onClick={() => handleSelectDigitalMethod("MOMO")}
                            className="font-body px-4 py-2 border border-[var(--cafe-primary)] text-[var(--cafe-primary)] rounded-lg"
                            style={{ fontSize: 12 }}
                          >Thử lại</button>
                        </div>
                      ) : null}
                    </div>
                  )}

                </div>

                {/* ── Fixed footer ── */}
                <div className="px-6 py-4 border-t border-[var(--cafe-bg)]">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="font-body flex-1 py-3 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]"
                      style={{ fontSize: 14, fontWeight: 500 }}
                    >
                      Quay lại
                    </button>
                    {/* Chỉ CASH cần nút Xác nhận — digital đã tự tạo đơn */}
                    {payMethod === "CASH" && (
                      <button
                        type="button"
                        onClick={() => handleCheckout("CASH")}
                        disabled={
                          paying ||
                          (cashReceived !== "" && cashChange !== null && cashChange < 0)
                        }
                        className="font-body flex-1 py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                        style={{ fontSize: 14, fontWeight: 600 }}
                      >
                        {paying ? "Đang xử lý..." : "Xác nhận thanh toán"}
                      </button>
                    )}
                    {/* Digital: nút Tạo đơn mới khi QR đã hiển thị */}
                    {(payMethod === "BANK_TRANSFER" || payMethod === "MOMO") && orderSuccess && (
                      <button
                        type="button"
                        onClick={resetOrder}
                        className="font-body flex-1 py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90"
                        style={{ fontSize: 14, fontWeight: 600 }}
                      >
                        Tạo đơn mới
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

