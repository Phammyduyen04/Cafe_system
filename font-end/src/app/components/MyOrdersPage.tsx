import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/order.service";
import { productService } from "../../services/product.service";
import type { Order, OrderItem } from "../../services/order.service";

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING:    "Chờ xác nhận",
  PAID:       "Đã thanh toán",
  CONFIRMED:  "Đã xác nhận",
  PREPARING:  "Đang chuẩn bị",
  DELIVERING: "Đang giao",
  COMPLETED:  "Hoàn thành",
  CANCELLED:  "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#f97316",
  PENDING:    "#e6a817",
  PAID:       "#06b6d4",
  CONFIRMED:  "#3b82f6",
  PREPARING:  "#8b5cf6",
  DELIVERING: "#f97316",
  COMPLETED:  "#22c55e",
  CANCELLED:  "#ef4444",
};

const REVIEWED_KEY = "coffea_reviewed_orders";

function getLocalReviewedOrders(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(REVIEWED_KEY) || "[]")); }
  catch { return new Set(); }
}
function markLocalReviewed(orderId: string) {
  const set = getLocalReviewedOrders();
  set.add(orderId);
  localStorage.setItem(REVIEWED_KEY, JSON.stringify([...set]));
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={(hover || value) >= s ? "#f5b731" : "none"}
            stroke="#f5b731" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────
interface ReviewState {
  rating: number;
  comment: string;
  done: boolean;
}

function ReviewModal({
  order,
  username,
  onClose,
  onSubmitted,
}: {
  order: Order;
  username: string;
  onClose: () => void;
  onSubmitted: (orderId: string) => void;
}) {
  // order_details (Prisma) dùng snake_case; order.items dùng camelCase
  const items: OrderItem[] = (() => {
    if (order.items?.length) return order.items;
    if ((order as any).order_items?.length) return (order as any).order_items;
    return ((order as any).order_details ?? [])
      .map((d: any) => ({
        productId: d.product_id ?? "",
        name: d.product_name ?? "Sản phẩm",
        size: d.size ?? "",
        quantity: d.quantity ?? 1,
        price: Number(d.unit_price ?? 0),
        image: d.image ?? undefined,
        toppings: (d.toppings ?? []).map((t: any) => t.topping_name ?? t.name ?? ""),
      }))
      .filter((it: OrderItem) => it.productId);
  })();

  const [reviews, setReviews] = useState<Record<string, ReviewState>>(() => {
    const init: Record<string, ReviewState> = {};
    items.forEach(it => { init[it.productId] = { rating: 5, comment: "", done: false }; });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const oid = order._id ?? order.order_id ?? "";

  const RATING_LABELS = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

  const handleSubmit = async () => {
    setError("");
    // Validate: mỗi sản phẩm phải có rating
    const missing = items.find(it => !reviews[it.productId]?.rating);
    if (missing) { setError("Vui lòng chọn số sao cho tất cả sản phẩm."); return; }
    setSubmitting(true);
    try {
      const pending = items.filter(it => !reviews[it.productId]?.done);
      await Promise.all(
        pending.map(it =>
          productService.createReview({
            customerName: username || "Khách",
            rating: reviews[it.productId]?.rating ?? 5,
            comment: reviews[it.productId]?.comment || "",
            productId: it.productId,
            orderId: oid,
          })
        )
      );
      markLocalReviewed(oid);
      setSuccess(true);
      setTimeout(() => { onSubmitted(oid); onClose(); }, 1800);
    } catch (e: any) {
      setError(e?.message || "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    markLocalReviewed(oid);
    onSubmitted(oid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8e4de]">
          <div>
            <p className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 4 }}>
              Đánh giá đơn hàng
            </p>
            <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 700 }}>
              {(order as any).order_code ?? `#${oid.slice(-8).toUpperCase()}`}
            </p>
          </div>
          <button onClick={onClose} className="text-cafe-primary hover:opacity-60 transition-opacity" style={{ fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-12 px-6">
            <div className="w-14 h-14 flex items-center justify-center bg-cafe-primary">
              <svg width="24" height="18" viewBox="0 0 28 22" fill="none">
                <path d="M2 11L10 19L26 2" stroke="#f1f0ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-body text-cafe-primary" style={{ fontSize: 16, fontWeight: 700, letterSpacing: "1px" }}>
              Cảm ơn bạn đã đánh giá!
            </p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 flex flex-col gap-6">
              {items.length === 0 ? (
                <p className="font-body text-center" style={{ fontSize: 13, color: "rgba(48,38,28,0.5)" }}>
                  Không có sản phẩm để đánh giá.
                </p>
              ) : items.map(it => {
                const r = reviews[it.productId];
                return (
                <div key={it.productId} className="flex flex-col gap-3 pb-5 border-b border-[#f0ece5] last:border-0 last:pb-0">
                  {/* Product info */}
                  <div className="flex items-center gap-3">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-12 h-12 object-cover border border-cafe-border shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-cafe-bg border border-cafe-border shrink-0 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9c9c9" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</p>
                      {it.size && <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)" }}>Size {it.size}</p>}
                    </div>
                  </div>
                  {/* Star rating + label */}
                  <div className="flex items-center gap-3">
                    <StarRating
                      value={r?.rating ?? 0}
                      onChange={v => setReviews(prev => ({ ...prev, [it.productId]: { ...prev[it.productId], rating: v } }))}
                    />
                    {(r?.rating ?? 0) > 0 && (
                      <span className="font-body" style={{ fontSize: 12, color: "var(--cafe-primary)", fontWeight: 600 }}>
                        {RATING_LABELS[r?.rating ?? 0]}
                      </span>
                    )}
                  </div>
                  {/* Comment */}
                  <textarea
                    value={r?.comment ?? ""}
                    onChange={e => setReviews(prev => ({ ...prev, [it.productId]: { ...prev[it.productId], comment: e.target.value } }))}
                    placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)..."
                    rows={2}
                    maxLength={500}
                    className="font-body w-full border border-[#d9d9d9] px-3 py-2 resize-none outline-none focus:border-cafe-primary transition-colors"
                    style={{ fontSize: 13, color: "#30261c" }}
                  />
                  {(r?.comment?.length ?? 0) > 0 && (
                    <p className="font-body text-right" style={{ fontSize: 10, color: "rgba(48,38,28,0.35)" }}>
                      {r?.comment?.length ?? 0}/500
                    </p>
                  )}
                </div>
              );})}

              {error && (
                <p className="font-body text-red-500" style={{ fontSize: 12 }}>{error}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8e4de]">
              <button
                onClick={handleSkip}
                className="font-body text-cafe-primary hover:opacity-60 transition-opacity"
                style={{ fontSize: 12, letterSpacing: "1px" }}
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || items.length === 0}
                className="font-body px-6 py-2.5 bg-cafe-primary text-cafe-bg disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}
              >
                {submitting ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyOrdersPage() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(getLocalReviewedOrders);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }

    orderService.getMyOrders()
      .then(async res => {
        const list: Order[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        setOrders(list);
        // Kiểm tra server-side review status cho các đơn đã hoàn thành
        const completedIds = list
          .filter(o => o.status === "COMPLETED")
          .map(o => o._id ?? o.order_id ?? "")
          .filter(Boolean);
        if (completedIds.length > 0) {
          const checks = await Promise.allSettled(
            completedIds.map(id => productService.checkOrderReviewed(id))
          );
          const serverReviewed = new Set<string>();
          checks.forEach((result, i) => {
            if (result.status === "fulfilled" && result.value === true) {
              serverReviewed.add(completedIds[i]);
            }
          });
          setReviewedOrders(prev => new Set([...prev, ...serverReviewed]));
        }
      })
      .catch(() => setError("Không thể tải danh sách đơn hàng."))
      .finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  const handleCancel = async (id: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(id);
    try {
      await orderService.cancelOrder(id);
      setOrders(prev => prev.map(o =>
        (o._id === id || o.order_id === id) ? { ...o, status: "CANCELLED" } : o
      ));
    } catch {
      alert("Không thể hủy đơn hàng. Vui lòng thử lại.");
    } finally {
      setCancelling(null);
    }
  };

  const handleRetryPayment = async (oid: string, paymentMethod: string) => {
    setRetrying(oid);
    try {
      const res = await orderService.retryPayment(oid);
      const payUrl: string = (res as any)?.payUrl ?? (res as any)?.data?.payUrl ?? "";
      if (!payUrl) { alert("Không thể lấy link thanh toán. Vui lòng thử lại."); return; }
      const storageKey = paymentMethod === "MOMO" ? "pendingMomoOrderId" : "pendingVnpayOrderId";
      localStorage.setItem(storageKey, oid);
      window.location.href = payUrl;
    } catch {
      alert("Không thể tạo lại thanh toán. Vui lòng thử lại.");
    } finally {
      setRetrying(null);
    }
  };

  const handleReviewSubmitted = (orderId: string) => {
    setReviewedOrders(prev => new Set([...prev, orderId]));
  };

  return (
    <div className="min-h-screen bg-cafe-bg pt-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-body text-cafe-primary" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
            Đơn hàng của tôi
          </h1>
          <Link to="/menu" className="font-body px-5 py-2.5 bg-cafe-primary text-cafe-bg" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>
            Đặt thêm
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cafe-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <p className="font-body text-red-500" style={{ fontSize: 13 }}>{error}</p>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20">
            <p className="font-body text-cafe-primary" style={{ fontSize: 15, fontWeight: 600 }}>Bạn chưa có đơn hàng nào</p>
            <Link to="/menu" className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2px" }}>
              Xem thực đơn
            </Link>
          </div>
        )}

        {/* Pagination info */}
        {orders.length > 0 && (
          <p className="font-body mb-2" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, orders.length)}–{Math.min(page * PAGE_SIZE, orders.length)} trên {orders.length} đơn hàng
          </p>
        )}

        <div className="flex flex-col gap-4">
          {orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(order => {
            const oid = order._id ?? order.order_id ?? "";
            const code = (order as any).order_code ?? `#${oid.slice(-8).toUpperCase()}`;
            const status = order.status ?? "PENDING";
            const total = order.total ?? order.total_amount ?? 0;
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "";
            const canCancel = status === "PENDING" || status === "PENDING_PAYMENT";
            const canRetry = status === "PENDING_PAYMENT";
            const paymentMethod: string = (order as any).payment_method ?? "";
            const isRetryable = canRetry && (paymentMethod === "MOMO" || paymentMethod === "VNPAY");
            const isCompleted = status === "COMPLETED";
            const needsReview = isCompleted && !reviewedOrders.has(oid);

            return (
              <div key={oid} className="border border-cafe-border bg-white flex flex-col">
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 700 }}>{code}</span>
                      {date && <span className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>{date}</span>}
                    </div>
                    <span
                      className="font-body px-3 py-1"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "1px",
                        color: STATUS_COLORS[status] ?? "#666",
                        background: `${STATUS_COLORS[status] ?? "#666"}18`,
                      }}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </div>

                  <div className="h-px bg-cafe-border" />

                  <div className="flex items-center justify-between">
                    <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.6)" }}>
                      {(order.items ?? (order as any).order_details ?? []).length} sản phẩm
                    </span>
                    <span className="font-body text-cafe-primary" style={{ fontSize: 14, fontWeight: 700 }}>
                      {formatVND(Number(total))}
                    </span>
                  </div>

                  {(isRetryable || canCancel) && (
                    <div className="flex gap-2 self-end">
                      {isRetryable && (
                        <button
                          onClick={() => handleRetryPayment(oid, paymentMethod)}
                          disabled={retrying === oid}
                          className="font-body px-4 py-2 bg-cafe-primary text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px" }}
                        >
                          {retrying === oid ? "ĐANG XỬ LÝ..." : "THANH TOÁN LẠI"}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(oid)}
                          disabled={cancelling === oid}
                          className="font-body px-4 py-2 border border-red-300 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px" }}
                        >
                          {cancelling === oid ? "ĐANG HỦY..." : "HỦY ĐƠN"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Review banner */}
                {needsReview && (
                  <div className="border-t border-[#f0ece5] bg-[#fdf9f3] px-5 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5b731" stroke="#f5b731" strokeWidth="0.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <p className="font-body text-cafe-primary" style={{ fontSize: 12 }}>
                        Hãy chia sẻ cảm nhận về đơn hàng này nhé!
                      </p>
                    </div>
                    <button
                      onClick={() => setReviewingOrder(order)}
                      className="font-body px-4 py-1.5 bg-cafe-primary text-cafe-bg shrink-0 transition-opacity hover:opacity-80"
                      style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase" }}
                    >
                      Đánh giá
                    </button>
                  </div>
                )}

                {/* Already reviewed */}
                {isCompleted && !needsReview && (
                  <div className="border-t border-[#f0ece5] px-5 py-2.5 flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <p className="font-body" style={{ fontSize: 11, color: "#22c55e", fontWeight: 500 }}>
                      Đã đánh giá
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {orders.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
              className="font-body w-9 h-9 border border-cafe-border flex items-center justify-center transition-colors hover:border-cafe-primary hover:text-cafe-primary disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontSize: 14 }}
            >
              ‹
            </button>

            {Array.from({ length: Math.ceil(orders.length / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                className="font-body w-9 h-9 border flex items-center justify-center transition-colors"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  borderColor: p === page ? "#30261c" : "#d9d9d9",
                  background: p === page ? "#30261c" : "white",
                  color: p === page ? "#f1f0ee" : "#30261c",
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => { setPage(p => Math.min(Math.ceil(orders.length / PAGE_SIZE), p + 1)); window.scrollTo(0, 0); }}
              disabled={page === Math.ceil(orders.length / PAGE_SIZE)}
              className="font-body w-9 h-9 border border-cafe-border flex items-center justify-center transition-colors hover:border-cafe-primary hover:text-cafe-primary disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontSize: 14 }}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          username={user?.username ?? "Khách"}
          onClose={() => setReviewingOrder(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
