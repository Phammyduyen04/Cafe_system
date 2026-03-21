import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/order.service";

import StepIndicator, { STEPS } from "./checkout/StepIndicator";
import OrderSummary from "./checkout/OrderSummary";
import FloatingInput from "./checkout/FloatingInput";
import FloatingSelect from "./checkout/FloatingSelect";

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </p>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [shipMethod, setShipMethod] = useState("standard");
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-cafe-bg">
        <p className="font-body text-cafe-primary" style={{ fontSize: 16, fontWeight: 600 }}>Bạn cần đăng nhập để thanh toán</p>
        <Link to="/login" className="font-body px-6 py-3 bg-cafe-primary text-white" style={{ fontSize: 13 }}>Đăng nhập</Link>
      </div>
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

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Final step: submit order
    setSubmitting(true);
    try {
      const res = await orderService.checkout({
        customerInfo: {
          fullName: `${firstName} ${lastName}`.trim() || user?.fullName || "Khách",
          email,
          phone,
          address,
          city,
          region,
          country: country || "Việt Nam",
        },
        shippingMethod: shipMethod,
        paymentMethod: "cash",
      });
      setOrderId(res.order?._id ?? "");
      await clearCart();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>Mã đơn hàng: #{orderId.slice(-8).toUpperCase()}</p>
        )}
        <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)", textAlign: "center", maxWidth: 360, lineHeight: 1.8 }}>
          Cảm ơn bạn đã tin tưởng Coffea. Chúng tôi sẽ xác nhận đơn hàng và liên hệ sớm nhất có thể.
        </p>
        <Link
          to="/"
          className="font-body mt-2 px-8 py-3 bg-cafe-primary text-cafe-bg"
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

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

          {/* Title */}
          <h1 className="font-body text-cafe-primary" style={{ fontSize: 34, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 16 }}>
            Thanh toán
          </h1>

          {/* Step tabs */}
          <div className="mb-10">
            <StepIndicator current={step} />
            <div className="h-px bg-[#d9d9d9] mt-3 relative">
              <div
                className="absolute top-0 left-0 h-px bg-cafe-primary transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="font-body mb-6 px-4 py-3 bg-red-50 border border-red-200" style={{ fontSize: 13, color: "#e74c3c" }}>
              {error}
            </div>
          )}

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 items-start">

            {/* LEFT: Form */}
            <form onSubmit={handleNext} className="flex-1 min-w-0 flex flex-col gap-8">

              {/* STEP 0: Information */}
              {step === 0 && (
                <>
                  <div>
                    <SectionLabel>Thông tin liên hệ</SectionLabel>
                    <div className="flex flex-col gap-3">
                      <FloatingInput label="Email" type="email" value={email} onChange={setEmail} required />
                      <FloatingInput label="Số điện thoại" type="tel" value={phone} onChange={setPhone} required />
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Địa chỉ giao hàng</SectionLabel>
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FloatingInput label="Họ" value={firstName} onChange={setFirst} required />
                        <FloatingInput label="Tên" value={lastName} onChange={setLast} required />
                      </div>
                      <FloatingSelect
                        label="Quốc gia"
                        value={country}
                        onChange={setCountry}
                        options={["Việt Nam", "Hoa Kỳ", "Nhật Bản", "Hàn Quốc", "Khác"]}
                      />
                      <FloatingInput label="Tỉnh / Thành phố" value={region} onChange={setRegion} required />
                      <FloatingInput label="Địa chỉ" value={address} onChange={setAddress} required />
                      <div className="grid grid-cols-2 gap-3">
                        <FloatingInput label="Quận / Huyện" value={city} onChange={setCity} required />
                        <FloatingInput label="Mã bưu chính" value={postal} onChange={setPostal} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 1: Shipping */}
              {step === 1 && (
                <div>
                  <SectionLabel>Phương thức vận chuyển</SectionLabel>
                  <div className="flex flex-col gap-3">
                    {[
                      { id: "standard", label: "Giao hàng tiêu chuẩn", sub: "3–5 ngày làm việc", price: "Miễn phí" },
                      { id: "express", label: "Giao hàng nhanh", sub: "1–2 ngày làm việc", price: "25.000₫" },
                      { id: "sameday", label: "Giao trong ngày", sub: "Trong vòng 4 giờ", price: "45.000₫" },
                    ].map(opt => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-4 px-5 py-4 border cursor-pointer transition-all duration-150"
                        style={{
                          background: shipMethod === opt.id ? "rgba(48,38,28,0.04)" : "white",
                          borderColor: shipMethod === opt.id ? "#30261c" : "#d9d9d9",
                        }}
                      >
                        <div
                          className="w-4 h-4 border-2 rounded-full flex items-center justify-center shrink-0 transition-colors"
                          style={{ borderColor: shipMethod === opt.id ? "#30261c" : "#d9d9d9" }}
                        >
                          {shipMethod === opt.id && <div className="w-2 h-2 rounded-full bg-cafe-primary" />}
                        </div>
                        <input type="radio" name="ship" value={opt.id} className="sr-only" checked={shipMethod === opt.id} onChange={() => setShipMethod(opt.id)} />
                        <div className="flex-1">
                          <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</p>
                          <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)", marginTop: 2 }}>{opt.sub}</p>
                        </div>
                        <span className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>{opt.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: Payment */}
              {step === 2 && (
                <div>
                  <SectionLabel>Thông tin thanh toán</SectionLabel>
                  <div className="flex flex-col gap-3">
                    <FloatingInput label="Tên chủ thẻ" value={cardName} onChange={setCardName} required />
                    <FloatingInput label="Số thẻ" value={cardNum} onChange={v => setCardNum(v.replace(/\D/g, "").slice(0, 16))} required />
                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput label="MM / YY" value={cardExp} onChange={v => {
                        const clean = v.replace(/\D/g, "").slice(0, 4);
                        setCardExp(clean.length > 2 ? clean.slice(0,2) + "/" + clean.slice(2) : clean);
                      }} required />
                      <FloatingInput label="CVV" type="password" value={cardCvv} onChange={v => setCardCvv(v.slice(0,4))} required />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      {["VISA", "MC", "JCB"].map(m => (
                        <div key={m} className="border border-[#d9d9d9] bg-white px-3 py-1.5">
                          <span className="font-body" style={{ fontSize: 10, fontWeight: 700, color: "rgba(48,38,28,0.5)", letterSpacing: "1px" }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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

              {/* Order summary on mobile */}
              <div className="lg:hidden mt-4">
                <OrderSummary />
              </div>
            </form>

            {/* RIGHT: Order Summary (desktop) */}
            <div className="hidden lg:block w-[360px] xl:w-[400px] shrink-0 sticky top-24">
              <OrderSummary />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
