import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/order.service";
import type { PaymentMethod, PaymentInfo, CheckoutDiscount, CheckoutPromotion } from "../../services/order.service";
import { promotionService } from "../../services/promotion.service";
import type { CalculateResult, Discount, Promotion } from "../../services/promotion.service";
import { productService } from "../../services/product.service";
import { estimateAhamoveFee } from "../../services/ahamove.service";

import StepIndicator, { STEPS } from "./checkout/StepIndicator";
import OrderSummary from "./checkout/OrderSummary";
import FloatingInput from "./checkout/FloatingInput";
import MapAddressPicker from "./checkout/MapAddressPicker";

// ─── Shipping options ────────────────────────────────────────────────────────
const SHIP_OPTIONS = [
  {
    id: "partner",
    label: "Giao hàng qua Ahamove",
    sub: "20–40 phút · Giao hàng nhanh qua Ahamove",
    feeLabel: "Tính theo khoảng cách",
    fee: 0,
    feeIsDynamic: true,
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

  // Step 0 — customer coordinates for Ahamove fee estimate
  const [coords, setCoords] = useState<[number, number] | null>(null);

  // Step 1 — shipping
  const [shipMethod, setShipMethod] = useState("partner");

  // Ahamove estimated fee
  const [ahamoveFee, setAhamoveFee] = useState<number | null>(null);
  const [ahamoveFeeSource, setAhamoveFeeSource] = useState<"ahamove" | "estimate" | null>(null);
  const [ahamoveLoading, setAhamoveLoading] = useState(false);
  const [ahamoveError, setAhamoveError] = useState("");
  const ahamoveAbortRef = useRef<AbortController | null>(null);

  // Step 2 — payment
  const [payMethods, setPayMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayMethod, setSelectedPayMethod] = useState("CASH");

  // Result
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  // Call Ahamove when step=1 and partner is selected and we have coordinates
  useEffect(() => {
    if (step !== 1 || shipMethod !== "partner" || !coords) return;

    ahamoveAbortRef.current?.abort();
    const ctrl = new AbortController();
    ahamoveAbortRef.current = ctrl;

    setAhamoveLoading(true);
    setAhamoveError("");
    setAhamoveFee(null);
    setAhamoveFeeSource(null);

    estimateAhamoveFee(coords[0], coords[1], address, ctrl.signal)
      .then(result => {
        setAhamoveFee(result.totalPrice);
        setAhamoveFeeSource(result.source ?? "ahamove");
      })
      .catch(err => {
        if ((err as Error).name === "AbortError") return;
        setAhamoveError(err.message || "Không thể tính phí ship");
      })
      .finally(() => setAhamoveLoading(false));

    return () => ctrl.abort();
  }, [step, shipMethod, coords, address]);

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ type: "PROMOTION" | "DISCOUNT"; programId: string; couponCode: string } | null>(null);
  const [couponResult, setCouponResult] = useState<CalculateResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [rewardDetails, setRewardDetails] = useState<{ productId: string; quantity: number; name: string; image?: string }[]>([]);

  // Compute shipping fee from selected option
  const selectedShip = SHIP_OPTIONS.find(o => o.id === shipMethod) ?? SHIP_OPTIONS[0];
  const shippingFee = shipMethod === "partner" ? (ahamoveFee ?? 0) : selectedShip.fee;
  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const discountAmount = couponResult?.discountAmount ?? 0;


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
          { id: 1, method_code: "CASH",  method_name: "Tiền mặt",             description: "Thanh toán tiền mặt khi nhận hàng hoặc tại quán", is_active: true },
          { id: 2, method_code: "VNPAY", method_name: "Thanh toán ngân hàng qua VNPAY", description: "Thanh toán qua VNPay — ATM, QR ngân hàng, thẻ quốc tế", is_active: true },
          { id: 3, method_code: "MOMO",  method_name: "Ví MoMo",               description: "Thanh toán qua ví điện tử MoMo", is_active: true },
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

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponResult(null);
    setAppliedCoupon(null);
    // Lặp lại mỗi productId theo quantity để backend kiểm tra đủ số lượng trigger
    const productIds = items.flatMap(i => Array(i.quantity ?? 1).fill(i.productId)).filter(Boolean);
    try {
      let type: "PROMOTION" | "DISCOUNT" = "DISCOUNT";
      let programId = "";
      try {
        const res = await promotionService.getDiscountByCoupon(code);
        programId = (res as any)?.discountId ?? "";
        type = "DISCOUNT";
      } catch {
        try {
          const res = await promotionService.getPromotionByCoupon(code);
          programId = (res as any)?.promotionId ?? "";
          type = "PROMOTION";
        } catch {
          setCouponError("Mã coupon không hợp lệ hoặc không tìm thấy.");
          return;
        }
      }
      if (!programId) { setCouponError("Mã coupon không hợp lệ."); return; }
      const result = await promotionService.calculate({ type, programId, orderAmount: subtotal, productIds });
      setAppliedCoupon({ type, programId, couponCode: code });
      setCouponResult(result);
      // Fetch tên sản phẩm tặng kèm (nếu có)
      if (result.rewardProducts?.length > 0) {
        const details = await Promise.all(
          result.rewardProducts.map(async (rp) => {
            try {
              const p = await productService.getProduct(rp.productId);
              return { productId: rp.productId, quantity: rp.quantity, name: p?.name ?? rp.productId, image: p?.image ?? p?.images?.[0] };
            } catch {
              return { productId: rp.productId, quantity: rp.quantity, name: rp.productId };
            }
          })
        );
        setRewardDetails(details);
      } else {
        setRewardDetails([]);
      }
    } catch (e: any) {
      setCouponError(e?.message ?? "Mã coupon không thể áp dụng cho đơn hàng này.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponResult(null);
    setCouponInput("");
    setCouponError("");
    setRewardDetails([]);
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
      // Build discounts/promotions arrays from applied coupon
      let checkoutDiscounts: CheckoutDiscount[] = [];
      let checkoutPromotions: CheckoutPromotion[] = [];
      if (appliedCoupon && couponResult && couponResult.discountAmount > 0) {
        if (appliedCoupon.type === "DISCOUNT") {
          const prog = couponResult.program as Discount;
          checkoutDiscounts = [{
            discountId: prog.discountId,
            discountName: prog.discountName,
            discountType: prog.discountType,
            discountValue: prog.discountValue,
            appliedAmount: couponResult.discountAmount,
          }];
        } else {
          const prog = couponResult.program as Promotion;
          checkoutPromotions = [{
            promotionId: prog.promotionId,
            promotionName: prog.promotionName,
            benefitType: prog.benefitType,
            benefitValue: 0,
            appliedAmount: couponResult.discountAmount,
          }];
        }
      }

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
        shippingFee: shippingFee,
        // QR trong DB cũng dùng VNPay redirect
        paymentMethod: selectedPayMethod === "QR" ? "VNPAY" : selectedPayMethod,
        discounts: checkoutDiscounts,
        promotions: checkoutPromotions,
      });
      const order = (res as any)?.order ?? res;
      const pInfo = (res as any)?.paymentInfo ?? null;
      const createdOrderId = order?._id ?? order?.order_id ?? "";
      setOrderId(createdOrderId);
      setOrderCode(order?.order_code ?? "");
      setPaymentInfo(pInfo);

      if (appliedCoupon && createdOrderId) {
        try {
          await promotionService.recordUsage({
            type: appliedCoupon.type,
            programId: appliedCoupon.programId,
            orderId: createdOrderId,
            customerId: (user as any)?.id ?? (user as any)?.userId ?? undefined,
            originalAmount: subtotal,
            discountAmount,
          });
        } catch { /* không làm hỏng đơn hàng nếu ghi nhận thất bại */ }
      }

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

      if (selectedPayMethod === "VNPAY" || selectedPayMethod === "QR") {
        if (!pInfo?.payUrl) {
          setError("Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại hoặc chọn phương thức khác.");
          return;
        }
        await clearCart();
        const oid = order?.order_id ?? "";
        if (oid) localStorage.setItem("pendingVnpayOrderId", oid);
        window.location.href = pInfo.payUrl;
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

  // ─── Success screen (CASH only — VNPAY/MOMO redirect về PaymentResultPage) ──
  if (done) {
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
        <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
          Cảm ơn bạn đã tin tưởng Coffea.<br />Chúng tôi sẽ xác nhận đơn hàng và liên hệ sớm nhất có thể.
        </p>
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
                  <MapAddressPicker
                    value={address}
                    onChange={setAddress}
                    onCoordinatesChange={(lat, lng) => setCoords([lat, lng])}
                  />
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
                        <input type="radio" name="ship" value={opt.id} className="sr-only" checked={shipMethod === opt.id} onChange={() => {
                          setShipMethod(opt.id);
                          // Nếu đổi sang giao hàng mà đang chọn tiền mặt → reset về VNPAY
                          if (opt.id !== "pickup" && selectedPayMethod === "CASH") {
                            const firstNonCash = payMethods.find(m => m.method_code !== "CASH");
                            if (firstNonCash) setSelectedPayMethod(firstNonCash.method_code);
                          }
                        }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                          <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", marginTop: 3, lineHeight: 1.6 }}>{opt.sub}</p>
                        </div>
                        {opt.id === "partner" ? (
                          <span className="font-body shrink-0 flex items-center gap-1" style={{ fontSize: 12, minWidth: 80, justifyContent: "flex-end" }}>
                            {ahamoveLoading && shipMethod === "partner" ? (
                              <span className="w-3 h-3 border border-cafe-primary border-t-transparent rounded-full animate-spin inline-block" />
                            ) : ahamoveFee !== null ? (
                              <span style={{ fontWeight: 600, color: "#30261c" }}>
                                +{ahamoveFee.toLocaleString("vi-VN")}₫
                              </span>
                            ) : ahamoveError ? (
                              <span style={{ color: "rgba(48,38,28,0.5)", fontSize: 11, fontStyle: "italic" }}>Chưa chọn địa chỉ</span>
                            ) : (
                              <span style={{ color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>{opt.feeLabel}</span>
                            )}
                          </span>
                        ) : (
                          <span className="font-body shrink-0" style={{ fontSize: 12, fontWeight: 600, color: "#30261c" }}>
                            {opt.feeLabel}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Ahamove: thông báo trạng thái tính phí */}
                  {shipMethod === "partner" && (
                    <div className="mt-3">
                      {!coords ? (
                        <div className="flex items-start gap-3 px-4 py-3 border border-amber-200 bg-amber-50">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <div className="flex-1">
                            <p className="font-body" style={{ fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                              Chưa có địa chỉ giao hàng
                            </p>
                            <p className="font-body" style={{ fontSize: 11, color: "#a16207", marginTop: 2, lineHeight: 1.6 }}>
                              Vui lòng quay lại bước Thông tin và chọn địa điểm trên bản đồ để tính phí Ahamove.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(0)}
                            className="font-body shrink-0 px-3 py-1.5 border border-amber-400 text-amber-700 hover:bg-amber-100 transition-colors"
                            style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}
                          >
                            Quay lại
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 border border-[#d9d9d9] bg-white">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.5)" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                          <p className="font-body flex-1 truncate" style={{ fontSize: 11, color: "rgba(48,38,28,0.6)" }}>
                            Giao đến: <span style={{ fontWeight: 600, color: "#30261c" }}>{address}</span>
                          </p>
                          {ahamoveLoading && (
                            <span className="font-body shrink-0" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>Đang tính phí...</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: Payment ── */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <SectionLabel>Mã giảm giá</SectionLabel>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between px-4 py-3 border border-[#c8e6c9] bg-[#f1f8f1]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 700 }}>{appliedCoupon.couponCode}</span>
                          {couponResult && couponResult.discountAmount > 0 && (
                            <span className="font-body" style={{ fontSize: 11, color: "#5a8a5a" }}>
                              Giảm {couponResult.discountAmount.toLocaleString("vi-VN")}₫
                            </span>
                          )}
                          {couponResult && couponResult.rewardProducts.length > 0 && (
                            <span className="font-body" style={{ fontSize: 11, color: "#5a8a5a" }}>
                              Tặng {couponResult.rewardProducts.length} sản phẩm
                            </span>
                          )}
                        </div>
                        <button type="button" onClick={handleRemoveCoupon} className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", textDecoration: "underline" }}>
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={e => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Nhập mã giảm giá"
                            className="flex-1 border border-[#d9d9d9] px-4 py-3 font-body bg-white text-cafe-primary"
                            style={{ fontSize: 13, outline: "none" }}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            className="px-5 py-3 border border-cafe-primary font-body text-cafe-primary transition-all hover:bg-cafe-primary hover:text-white disabled:opacity-50"
                            style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}
                          >
                            {couponLoading ? "..." : "Áp dụng"}
                          </button>
                        </div>
                        {couponError && (
                          <p className="font-body" style={{ fontSize: 11, color: "#e74c3c" }}>{couponError}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <SectionLabel>Phương thức thanh toán</SectionLabel>
                    <div className="flex flex-col gap-3">
                      {payMethods.filter(m =>
                        // Tiền mặt chỉ khả dụng khi nhận tại quán
                        m.method_code !== "CASH" || shipMethod === "pickup"
                      ).map(m => (
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
                          {m.method_code === "VNPAY" && (
                            <span className="font-body px-2 py-0.5 text-white shrink-0" style={{ fontSize: 10, fontWeight: 700, background: "#005baa", borderRadius: 4 }}>VNPay</span>
                          )}
                        </label>
                      ))}
                      {payMethods.length === 0 && (
                        <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>Đang tải phương thức thanh toán...</p>
                      )}
                    </div>
                  </div>

                  {/* Payment method info panel */}
                  {(selectedPayMethod === "QR" || selectedPayMethod === "VNPAY") && (
                    <div className="border border-[#cce0f5] bg-[#f0f7ff] p-5 flex flex-col gap-3">
                      <p className="font-body" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1px", color: "#005baa" }}>THANH TOÁN QUA VNPAY</p>
                      <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.7)", lineHeight: 1.8 }}>
                        Sau khi xác nhận đơn hàng, bạn sẽ được chuyển đến trang VNPay để thanh toán.<br />
                        Hỗ trợ thẻ ATM nội địa, thẻ quốc tế và QR ngân hàng.
                      </p>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#005baa" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className="font-body" style={{ fontSize: 11, color: "#005baa" }}>Bạn sẽ được chuyển sang VNPay sau khi nhấn xác nhận</span>
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
                <OrderSummary
                  shippingFee={step >= 1 ? shippingFee : undefined}
                  shipOption={step >= 1 ? selectedShip.id : undefined}
                  discountAmount={couponResult?.discountAmount}
                  couponCode={appliedCoupon?.couponCode}
                  rewardProducts={rewardDetails}
                  ahamoveFee={ahamoveFee}
                  ahamoveLoading={ahamoveLoading}
                />
              </div>
            </form>

            {/* RIGHT: Order Summary */}
            <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-24">
              <OrderSummary
                shippingFee={step >= 1 ? shippingFee : undefined}
                shipOption={step >= 1 ? selectedShip.id : undefined}
                discountAmount={couponResult?.discountAmount}
                couponCode={appliedCoupon?.couponCode}
                rewardProducts={rewardDetails}
                ahamoveFee={ahamoveFee}
                ahamoveLoading={ahamoveLoading}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
