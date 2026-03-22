import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { LOGIN_BG } from "../../constants/images";
import { authService } from "../../services/auth.service";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Step 1: Gửi mã xác nhận
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xử lý nhập mã OTP
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    codeRefs.current[focusIndex]?.focus();
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }
    setError("");
    setStep(3);
  };

  // Step 3: Đặt lại mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(email, code.join(""), newPassword);
      setSuccess("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đặt lại mật khẩu thất bại";
      setError(message);
      // Nếu lỗi liên quan mã xác nhận → quay lại step 2 nhập lại
      if (message.includes("Mã xác nhận")) {
        setCode(["", "", "", "", "", ""]);
        setStep(2);
      }
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setCooldown(60);
      setCode(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi lại mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: { title: "Quên mật khẩu", desc: "Nhập email để nhận mã xác nhận." },
    2: { title: "Nhập mã xác nhận", desc: `Mã 6 chữ số đã được gửi đến ${email}` },
    3: { title: "Đặt lại mật khẩu", desc: "Nhập mật khẩu mới cho tài khoản của bạn." },
  };

  return (
    <div className="min-h-screen flex bg-cafe-bg">
      {/* Left image panel */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative overflow-hidden shrink-0">
        <img src={LOGIN_BG} alt="Coffea" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-cafe-primary/40" />
        <div className="absolute bottom-12 left-12">
          <p className="font-body" style={{ fontSize: 38, fontWeight: 700, color: "var(--cafe-bg)", letterSpacing: "3px" }}>COFFEA</p>
          <p className="font-body" style={{ fontSize: 14, color: "rgba(241,240,238,0.75)", letterSpacing: "1px", marginTop: 6 }}>Thức uống tinh tế — Không gian ấm cúng</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative">
        <Link
          to="/login"
          className="absolute top-6 left-6 flex items-center gap-2 text-cafe-primary hover:opacity-70 transition-opacity"
          aria-label="Quay lại đăng nhập"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          <span className="font-body" style={{ fontSize: 13, fontWeight: 500 }}>Đăng nhập</span>
        </Link>

        <div className="w-full max-w-[420px]">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 flex items-center justify-center font-body transition-colors"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    background: step >= s ? "var(--cafe-primary)" : "var(--cafe-accent)",
                    color: step >= s ? "var(--cafe-bg)" : "rgba(48,38,28,0.4)",
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className="w-8 h-px" style={{ background: step > s ? "var(--cafe-primary)" : "var(--cafe-accent)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-body text-cafe-primary" style={{ fontSize: 36, fontWeight: 700, letterSpacing: "1px" }}>
              {stepTitles[step].title}
            </h1>
            <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.55)", marginTop: 6 }}>
              {stepTitles[step].desc}
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="font-body mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-cafe-red" style={{ fontSize: 13 }}>
              {error}
            </div>
          )}
          {success && (
            <div className="font-body mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded text-green-700" style={{ fontSize: 13 }}>
              {success}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                  style={{ fontSize: 13, borderRadius: 0 }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="font-body w-full py-3.5 mt-2 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontWeight: 600, fontSize: 13, letterSpacing: "2.5px" }}
              >
                {loading ? "ĐANG GỬI..." : "GỬI MÃ XÁC NHẬN"}
              </button>
            </form>
          )}

          {/* Step 2: OTP Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="font-body w-12 h-14 border border-cafe-border bg-white text-center outline-none focus:border-cafe-primary transition-colors text-cafe-primary"
                    style={{ fontSize: 24, fontWeight: 700, borderRadius: 0 }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="font-body w-full py-3.5 mt-2 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98]"
                style={{ fontWeight: 600, fontSize: 13, letterSpacing: "2.5px" }}
              >
                XÁC NHẬN
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="font-body text-cafe-primary hover:opacity-70 transition-opacity disabled:opacity-40"
                  style={{ fontSize: 12, textDecoration: "underline" }}
                >
                  {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    minLength={8}
                    className="font-body w-full border border-cafe-border bg-white px-4 py-3 pr-12 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                    style={{ fontSize: 13, borderRadius: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(48,38,28,0.4)] hover:text-cafe-primary transition-colors"
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Xác nhận mật khẩu
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  minLength={8}
                  className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                  style={{ fontSize: 13, borderRadius: 0 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="font-body w-full py-3.5 mt-2 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontWeight: 600, fontSize: 13, letterSpacing: "2.5px" }}
              >
                {loading ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
