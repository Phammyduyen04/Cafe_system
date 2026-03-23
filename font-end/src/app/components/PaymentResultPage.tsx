import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { orderService } from "../../services/order.service";

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"success" | "failed" | "pending">("pending");
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const resultCode = params.get("resultCode") ?? params.get("errorCode");
  const message = params.get("message") ?? params.get("localMessage") ?? "";
  const transId = params.get("transId") ?? "";

  // internal order_id stored before redirect to MoMo
  const internalOrderId = localStorage.getItem("pendingMomoOrderId") ?? "";

  useEffect(() => {
    if (resultCode === null) {
      setStatus("pending");
    } else if (resultCode === "0") {
      setStatus("success");
      // Poll order status until PAID (IPN may take a few seconds)
      if (internalOrderId) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const order = await orderService.getOrderById(internalOrderId);
            const s = (order as any)?.status ?? (order as any)?.data?.status;
            if (s === "PAID" || s === "CONFIRMED" || s === "PREPARING" || s === "COMPLETED") {
              setOrderConfirmed(true);
              clearInterval(interval);
              localStorage.removeItem("pendingMomoOrderId");
            }
          } catch {}
          if (attempts >= 12) { // ~1 minute
            clearInterval(interval);
            localStorage.removeItem("pendingMomoOrderId");
          }
        }, 5000);
        return () => clearInterval(interval);
      }
    } else {
      setStatus("failed");
    }
  }, [resultCode]);

  if (status === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-cafe-bg">
        <p className="font-body text-cafe-primary" style={{ fontSize: 16, fontWeight: 600 }}>
          Đang xác nhận thanh toán...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-cafe-bg">
        <div className="w-16 h-16 flex items-center justify-center bg-cafe-primary">
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11L10 19L26 2" stroke="#f1f0ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-body text-cafe-primary" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
          Thanh toán thành công!
        </p>
        {transId && (
          <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>
            Mã giao dịch MoMo: <strong>{transId}</strong>
          </p>
        )}
        {orderConfirmed ? (
          <p className="font-body" style={{ fontSize: 13, color: "#2e7d32", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
            ✓ Đơn hàng đã được xác nhận và đang được xử lý.
          </p>
        ) : (
          <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
            Cảm ơn bạn đã thanh toán qua MoMo.<br />
            Hệ thống đang xác nhận đơn hàng...
          </p>
        )}
        <div className="flex gap-3 mt-2">
          <Link
            to="/my-orders"
            className="font-body px-6 py-3 border border-cafe-primary text-cafe-primary"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}
          >
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Failed
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-cafe-bg">
      <div className="w-16 h-16 flex items-center justify-center" style={{ background: "#e74c3c" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <line x1="4" y1="4" x2="20" y2="20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="4" x2="4" y2="20" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-body text-cafe-primary" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
        Thanh toán thất bại
      </p>
      {message && (
        <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
          {message}
        </p>
      )}
      {orderId && (
        <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.4)" }}>
          Mã đơn: {orderId}
        </p>
      )}
      <div className="flex gap-3 mt-2">
        <Link
          to="/checkout"
          className="font-body px-6 py-3 border border-cafe-primary text-cafe-primary"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}
        >
          Thử lại
        </Link>
        <Link
          to="/my-orders"
          className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg"
          style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}
        >
          Đơn hàng của tôi
        </Link>
      </div>
    </div>
  );
}
