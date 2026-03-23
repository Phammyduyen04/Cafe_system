import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/order.service";
import type { Order } from "../../services/order.service";

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

export default function MyOrdersPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    orderService.getMyOrders()
      .then(res => {
        const list: Order[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        setOrders(list);
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

        <div className="flex flex-col gap-4">
          {orders.map(order => {
            const oid = order._id ?? order.order_id ?? "";
            const code = (order as any).order_code ?? `#${oid.slice(-8).toUpperCase()}`;
            const status = order.status ?? "PENDING";
            const total = order.total ?? order.total_amount ?? 0;
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "";
            const canCancel = status === "PENDING" || status === "PENDING_PAYMENT";
            return (
              <div key={oid} className="border border-cafe-border bg-white p-5 flex flex-col gap-3">
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
                    {(order.items ?? []).length} sản phẩm
                  </span>
                  <span className="font-body text-cafe-primary" style={{ fontSize: 14, fontWeight: 700 }}>
                    {formatVND(Number(total))}
                  </span>
                </div>

                {canCancel && (
                  <button
                    onClick={() => handleCancel(oid)}
                    disabled={cancelling === oid}
                    className="font-body self-end px-4 py-2 border border-red-300 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px" }}
                  >
                    {cancelling === oid ? "ĐANG HỦY..." : "HỦY ĐƠN"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
