import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/order.service";
import type { PaymentMethod, PaymentInfo } from "../../services/order.service";

import StepIndicator, { STEPS } from "./checkout/StepIndicator";
import OrderSummary from "./checkout/OrderSummary";
import FloatingInput from "./checkout/FloatingInput";
import MapAddressPicker from "./checkout/MapAddressPicker";

// ─── Shipping options ────────────────────────────────────────────────────────
const SHIP_OPTIONS = [
  {
    id: "partner",
    label: "Giao hàng qua đối tác",
    sub: "20–40 phút · Grab / ShopeeFood / Ahamove (tự phân công)",
    feeLabel: "Tính theo khoảng cách",
    fee: 0,
    feeIsDynamic: true,
  },
  {
    id: "priority",
    label: "Giao hàng ưu tiên",
    sub: "15–25 phút · Ưu tiên tài xế gần / express",
    feeLabel: "+15.000₫",
    fee: 15000,
    feeIsDynamic: false,
  },
  {
    id: "self",
    label: "Khách tự đặt ship",
    sub: "Tùy khách · Quán chuẩn bị sẵn đồ, khách gọi tài xế riêng",
    feeLabel: "Khách tự trả",
    fee: 0,
    feeIsDynamic: false,
  },
  {
    id: "pickup",
    label: "Nhận tại quán",
    sub: "5–10 phút chuẩn bị · Đến quán lấy trực tiếp",
    feeLabel: "Miễn phí",
    fee: 0,
    feeIsDynamic: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </p>
  );
}

const ArrowRight = () => (
  <svg width="32" height="10" viewBox="0 0 48 10" fill="none">
    <line x1="0" y1="5" x2="40" y2="5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M38 1L44 5L38 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="52" height="12" viewBox="0 0 52 12" fill="none">
    <line x1="52" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 1.5L8 6L14 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 0 — contact + address
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Step 1 — shipping
  const [shipMethod, setShipMethod] = useState("partner");

  // Step 2 — payment
  const [payMethods, setPayMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayMethod, setSelectedPayMethod] = useState("CASH");

  // Result
  const [done, setDone] = useState(false);
  const [waitingQR, setWaitingQR] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [qrPaid, setQrPaid] = useState(false);

  // Compute shipping fee from selected option
  const selectedShip = SHIP_OPTIONS.find(o => o.id === shipMethod) ?? SHIP_OPTIONS[0];
  const shippingFee = selectedShip.fee;

  // Poll order status when waiting for QR payment
  useEffect(() => {
    if (!waitingQR || qrPaid || !orderId) return;
    const interval = setInterval(async () => {
      try {
        const order = await orderService.getOrderById(orderId);
        const status = (order as any)?.status ?? (order as any)?.data?.status;
        if (status === "PAID" || status === "CONFIRMED" || status === "PREPARING" || status === "COMPLETED") {
          setQrPaid(true);
          clearInterval(interval);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [waitingQR, qrPaid, orderId]);

  useEffect(() => {
    orderService.getPaymentMethods()
      .then(res => {
        const list: PaymentMethod[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        const active = list.filter(m => m.is_active);
        setPayMethods(active);
        if (active.length > 0) setSelectedPayMethod(active[0].method_code);
      })
      .catch(() => {
        setPayMethods([
          { id: 1, method_code: "CASH", method_name: "Tiền mặt", description: "Thanh toán tiền mặt khi nhận hàng hoặc tại quán", is_active: true },
          { id: 2, method_code: "QR", method_name: "Chuyển khoản QR", description: "Chuyển khoản ngân hàng qua mã VietQR", is_active: true },
          { id: 3, method_code: "MOMO", method_name: "Ví MoMo", description: "Thanh toán qua ví điện tử MoMo", is_active: true },
        ]);
      });
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-cafe-bg">
        <p className="font-body text-cafe-primary" style={{ fontSize: 16, fontWeight: 600 }}>Bạn cần đăng nhập để thanh toán</p>
        <Link to="/login" className="font-body px-6 py-3 bg-cafe-primary text-white" style={{ fontSize: 13 }}>Đăng nhập</Link>
      </div>
    );
  }

  const validateStep0 = (): string => {
    if (!fullName.trim() || fullName.trim().length < 2)
      return "Vui lòng nhập họ tên (tối thiểu 2 ký tự).";
    const phoneClean = phone.trim().replace(/\s/g, "");
    if (!phoneClean)
      return "Vui lòng nhập số điện thoại.";
    if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phoneClean))
      return "Số điện thoại không hợp lệ (VD: 0912345678).";
    if (!address.trim() || address.trim().length < 10)
      return "Địa chỉ giao hàng quá ngắn, vui lòng nhập đầy đủ (tối thiểu 10 ký tự).";
    return "";
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 0) {
      const err = validateStep0();
      if (err) { setError(err); return; }
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Final step: submit order
    setSubmitting(true);
    try {
      const res = await orderService.checkout({
        customerInfo: {
          fullName: fullName || user?.username || "Khách",
          email: "",
          phone,
          address,
          city: "",
          region: "",
          country: "Việt Nam",
        },
        shippingMethod: shipMethod,
        shippingFee: selectedShip.feeIsDynamic ? 0 : shippingFee,
        paymentMethod: selectedPayMethod,
      });
      const order = (res as any)?.order ?? res;
      const pInfo = (res as any)?.paymentInfo ?? null;
      setOrderId(order?._id ?? order?.order_id ?? "");
      setOrderCode(order?.order_code ?? "");
      setPaymentInfo(pInfo);

      if (selectedPayMethod === "MOMO") {
        if (!pInfo?.payUrl) {
          setError("Không thể khởi tạo thanh toán MoMo. Vui lòng thử lại hoặc chọn phương thức khác.");
          return;
        }
        await clearCart();
        const oid = order?.order_id ?? "";
        if (oid) localStorage.setItem("pendingMomoOrderId", oid);
        window.location.href = pInfo.payUrl;
        return;
      }

      if (selectedPayMethod === "QR") {
        await clearCart();
        setWaitingQR(true);
        return;
      }

      // CASH — hiển thị thành công ngay
      await clearCart();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── QR Waiting screen ───────────────────────────────────────────────────
  if (waitingQR) {
    const qrUrl = paymentInfo?.qrUrl;
    const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
    const total = selectedShip.feeIsDynamic ? subtotal : subtotal + shippingFee;

    if (qrPaid) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-cafe-bg pt-20">
          <div className="w-16 h-16 flex items-center justify-center bg-cafe-primary">
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
              <path d="M2 11L10 19L26 2" stroke="#f1f0ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-body text-cafe-primary" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>Thanh toán thành công!</p>
          <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>Mã đơn hàng: <strong>{orderCode}</strong></p>
          <p className="font-body text-center" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", maxWidth: 360, lineHeight: 1.8 }}>
            Hệ thống đã ghi nhận thanh toán. Đơn hàng đang được xử lý.
          </p>
          <div className="flex gap-3 mt-2">
            <Link to="/my-orders" className="font-body px-6 py-3 border border-cafe-primary text-cafe-primary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>Xem đơn hàng</Link>
            <Link to="/" className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>Về trang chủ</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-cafe-bg pt-20">
        {/* Spinner */}
        <div className="flex flex-col items-center gap-2">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="#d9d9d9" strokeWidth="3" />
            <path d="M16 3 A13 13 0 0 1 29 16" stroke="#30261c" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="font-body text-cafe-primary" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "1px" }}>Đang chờ thanh toán...</p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-xs border border-cafe-border bg-white p-6">
          <p className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Quét mã QR để thanh toán</p>
          {qrUrl ? (
            <img src={qrUrl} alt="QR thanh toán" className="w-56 h-56 object-contain" />
          ) : (
            <div className="w-56 h-56 border border-dashed flex items-center justify-center">
              <p className="font-body text-center" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>Không thể tải mã QR</p>
            </div>
          )}
          <div className="w-full flex flex-col gap-1 pt-2 border-t border-[#f0ece5]">
            <div className="flex justify-between">
              <span className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)" }}>Mã đơn hàng</span>
              <span className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 700 }}>{orderCode}</span>
            </div>
            {!selectedShip.feeIsDynamic && (
              <div className="flex justify-between">
                <span className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)" }}>Tổng tiền</span>
                <span className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 700 }}>
                  {total.toLocaleString("vi-VN")}₫
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="font-body text-center" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", maxWidth: 320, lineHeight: 1.8 }}>
          Chuyển khoản đúng số tiền và nội dung <strong>{orderCode}</strong>.<br />
          Trang này sẽ tự cập nhật khi nhận được thanh toán.
        </p>

        <Link to="/my-orders" className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", textDecoration: "underline" }}>
          Kiểm tra đơn hàng
        </Link>
      </div>
    );
  }

  // ─── Success screen ───────────────────────────────────────────────────────
  if (done) {
    const qrUrl = paymentInfo?.qrUrl;
    const isQR = selectedPayMethod === "QR";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-cafe-bg">
        <div className="w-16 h-16 flex items-center justify-center bg-cafe-primary">
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <path d="M2 11L10 19L26 2" stroke="#f1f0ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-body text-cafe-primary" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
          Đặt hàng thành công!
        </p>
        {orderId && (
          <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>
            Mã đơn hàng: <strong>{orderCode || `#${orderId.slice(-8).toUpperCase()}`}</strong>
          </p>
        )}

        {isQR && (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs border border-cafe-border bg-white p-6">
            <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
              Quét mã QR để thanh toán
            </p>
            {qrUrl ? (
              <img src={qrUrl} alt="QR thanh toán" className="w-52 h-52 object-contain" />
            ) : (
              <div className="w-52 h-52 border border-dashed border-cafe-border flex items-center justify-center">
                <p className="font-body text-center" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>Không thể tải mã QR</p>
              </div>
            )}
            <p className="font-body text-center" style={{ fontSize: 11, color: "rgba(48,38,28,0.55)", lineHeight: 1.7 }}>
              Chuyển khoản đúng số tiền và nội dung <strong>{orderCode}</strong>.<br />
              Nhân viên sẽ xác nhận sau khi nhận được tiền.
            </p>
          </div>
        )}

        {!isQR && (
          <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
            Cảm ơn bạn đã tin tưởng Coffea.<br />Chúng tôi sẽ xác nhận đơn hàng và liên hệ sớm nhất có thể.
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <Link to="/my-orders" className="font-body px-6 py-3 border border-cafe-primary text-cafe-primary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>
            Xem đơn hàng
          </Link>
          <Link to="/" className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" }}>
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // ─── Checkout form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cafe-bg">
      <div className="pt-20">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-8">

          {/* Back arrow */}
          <button
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="font-body flex items-center gap-2 mb-8 transition-opacity hover:opacity-60 text-cafe-primary"
            style={{ fontSize: 12, letterSpacing: "1px", background: "none", border: "none" }}
          >
            <ArrowLeft />
          </button>

          <h1 className="font-body text-cafe-primary" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16 }}>
            Thanh toán
          </h1>

          {/* Step indicator */}
          <div className="mb-10">
            <StepIndicator current={step} />
            <div className="h-px bg-[#d9d9d9] mt-3 relative">
              <div className="absolute top-0 left-0 h-px bg-cafe-primary transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          {error && (
            <div className="font-body mb-6 px-4 py-3 bg-red-50 border border-red-200" style={{ fontSize: 13, color: "#e74c3c" }}>
              {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">

            {/* LEFT: Form */}
            <form onSubmit={handleNext} className="flex-1 min-w-0 flex flex-col gap-8">

              {/* ── STEP 0: Contact + Address ── */}
              {step === 0 && (
                <div className="flex flex-col gap-3">
                  <SectionLabel>Thông tin đặt hàng</SectionLabel>
                  <FloatingInput label="Họ và tên" value={fullName} onChange={setFullName} required />
                  <FloatingInput label="Số điện thoại" type="tel" value={phone} onChange={setPhone} required />
                  <MapAddressPicker value={address} onChange={setAddress} />
                </div>
              )}

              {/* ── STEP 1: Shipping ── */}
              {step === 1 && (
                <div>
                  <SectionLabel>Phương thức vận chuyển</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {SHIP_OPTIONS.map(opt => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-4 px-5 py-4 border cursor-pointer transition-all duration-150"
                        style={{
                          background: shipMethod === opt.id ? "rgba(48,38,28,0.04)" : "white",
                          borderColor: shipMethod === opt.id ? "#30261c" : "#d9d9d9",
                        }}
                      >
                        <div className="mt-0.5 w-4 h-4 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ borderColor: shipMethod === opt.id ? "#30261c" : "#d9d9d9" }}>
                          {shipMethod === opt.id && <div className="w-2 h-2 rounded-full bg-cafe-primary" />}
                        </div>
                        <input type="radio" name="ship" value={opt.id} className="sr-only" checked={shipMethod === opt.id} onChange={() => setShipMethod(opt.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                          <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", marginTop: 3, lineHeight: 1.6 }}>{opt.sub}</p>
                        </div>
                        <span className="font-body shrink-0" style={{ fontSize: 12, fontWeight: 600, color: opt.feeIsDynamic ? "rgba(48,38,28,0.45)" : "#30261c", fontStyle: opt.feeIsDynamic ? "italic" : "normal" }}>
                          {opt.feeLabel}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ── STEP 2: Payment ── */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <SectionLabel>Phương thức thanh toán</SectionLabel>
                    <div className="flex flex-col gap-3">
                      {payMethods.map(m => (
                        <label
                          key={m.method_code}
                          className="flex items-center gap-4 px-5 py-4 border cursor-pointer transition-all duration-150"
                          style={{
                            background: selectedPayMethod === m.method_code ? "rgba(48,38,28,0.04)" : "white",
                            borderColor: selectedPayMethod === m.method_code ? "#30261c" : "#d9d9d9",
                          }}
                        >
                          <div className="w-4 h-4 border-2 rounded-full flex items-center justify-center shrink-0" style={{ borderColor: selectedPayMethod === m.method_code ? "#30261c" : "#d9d9d9" }}>
                            {selectedPayMethod === m.method_code && <div className="w-2 h-2 rounded-full bg-cafe-primary" />}
                          </div>
                          <input type="radio" name="payMethod" value={m.method_code} className="sr-only" checked={selectedPayMethod === m.method_code} onChange={() => setSelectedPayMethod(m.method_code)} />
                          <div className="flex-1">
                            <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{m.method_name}</p>
                            {m.description && (
                              <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", marginTop: 2 }}>{m.description}</p>
                            )}
                          </div>
                          {/* Payment icon hint */}
                          {m.method_code === "MOMO" && (
                            <span className="font-body px-2 py-0.5 text-white shrink-0" style={{ fontSize: 10, fontWeight: 700, background: "#a50064", borderRadius: 4 }}>MoMo</span>
                          )}
                          {m.method_code === "QR" && (
                            <span className="font-body px-2 py-0.5 shrink-0" style={{ fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", borderRadius: 4 }}>VietQR</span>
                          )}
                        </label>
                      ))}
                      {payMethods.length === 0 && (
                        <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>Đang tải phương thức thanh toán...</p>
                      )}
                    </div>
                  </div>

                  {/* Payment method info panel */}
                  {selectedPayMethod === "QR" && (
                    <div className="border border-[#c8e6c9] bg-[#f1f8f1] p-5 flex flex-col gap-3">
                      <p className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>HƯỚNG DẪN CHUYỂN KHOẢN</p>
                      <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.7)", lineHeight: 1.8 }}>
                        Sau khi xác nhận đơn hàng, bạn sẽ nhận được mã QR để chuyển khoản ngân hàng.<br />
                        Vui lòng điền đúng <strong>số tiền</strong> và <strong>nội dung chuyển khoản</strong> để đơn được xác nhận nhanh chóng.
                      </p>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className="font-body" style={{ fontSize: 11, color: "#2e7d32" }}>Hỗ trợ tất cả ngân hàng nội địa qua VietQR</span>
                      </div>
                    </div>
                  )}

                  {selectedPayMethod === "MOMO" && (
                    <div className="border border-[#f8bbd0] bg-[#fdf0f5] p-5 flex flex-col gap-3">
                      <p className="font-body" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#a50064" }}>THANH TOÁN QUA MoMo</p>
                      <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.7)", lineHeight: 1.8 }}>
                        Sau khi xác nhận đơn hàng, bạn sẽ được chuyển đến trang thanh toán MoMo.<br />
                        Hoàn tất thanh toán trên ứng dụng MoMo để đơn hàng được xử lý ngay lập tức.
                      </p>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a50064" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span className="font-body" style={{ fontSize: 11, color: "#a50064" }}>Bạn sẽ được chuyển sang MoMo sau khi nhấn xác nhận</span>
                      </div>
                    </div>
                  )}

                  {selectedPayMethod === "CASH" && (
                    <div className="border border-[#fff3cd] bg-[#fffbf0] p-5 flex flex-col gap-3">
                      <p className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px" }}>THANH TOÁN TIỀN MẶT</p>
                      <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.7)", lineHeight: 1.8 }}>
                        {shipMethod === "pickup"
                          ? "Vui lòng thanh toán tại quầy khi đến nhận hàng."
                          : "Vui lòng chuẩn bị tiền mặt khi nhận hàng. Nhân viên giao hàng sẽ thu tiền tại địa chỉ của bạn."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="flex items-center justify-between px-6 py-4 w-full md:w-auto md:self-start transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed bg-cafe-primary"
                style={{ minWidth: 260 }}
              >
                <span className="font-body text-cafe-bg" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}>
                  {submitting ? "ĐANG XỬ LÝ..." : step === 0 ? "Vận chuyển" : step === 1 ? "Thanh toán" : "Xác nhận đơn hàng"}
                </span>
                <span className="text-cafe-bg"><ArrowRight /></span>
              </button>

              <div className="lg:hidden mt-4">
                <OrderSummary shippingFee={step >= 1 ? shippingFee : undefined} shipOption={step >= 1 ? selectedShip.id : undefined} />
              </div>
            </form>

            {/* RIGHT: Order Summary */}
            <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-24">
              <OrderSummary shippingFee={step >= 1 ? shippingFee : undefined} shipOption={step >= 1 ? selectedShip.id : undefined} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
