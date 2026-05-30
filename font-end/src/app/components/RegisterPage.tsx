import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { LOGIN_BG } from "../../constants/images";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setError("");
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await authService.register({ username, fullName, email, password, phone });
      // If server returns tokens, auto-login; otherwise go to login page
      const r = res as any;
      if (r.accessToken && r.refreshToken && r.user) {
        login(r.accessToken, r.refreshToken, r.user);
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setError("");
    setGoogleLoading(true);
    try {
      const res = await authService.googleLogin(credentialResponse.credential);
      login(res.accessToken, res.refreshToken, res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký bằng Google thất bại");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cafe-bg">
      {/* ── Left image panel ── */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative overflow-hidden shrink-0">
        <img
          src={LOGIN_BG}
          alt="Coffea"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-cafe-primary/40" />
        <div className="absolute bottom-12 left-12">
          <p className="font-body" style={{ fontSize: 38, fontWeight: 700, color: "var(--cafe-bg)", letterSpacing: "3px" }}>COFFEA</p>
          <p className="font-body" style={{ fontSize: 14, color: "rgba(241,240,238,0.75)", letterSpacing: "1px", marginTop: 6 }}>Thức uống tinh tế — Không gian ấm cúng</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative">
        {/* Back to home */}
        <Link
          to="/"
          className="absolute top-6 right-6 flex items-center gap-2 text-cafe-primary hover:opacity-70 transition-opacity"
          aria-label="Về trang chủ"
        >
          <span className="font-body" style={{ fontSize: 13, fontWeight: 500 }}>Trang chủ</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-body text-cafe-primary" style={{ fontSize: 36, fontWeight: 700, marginTop: 20, letterSpacing: "1px" }}>Đăng ký</h1>
            <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.55)", marginTop: 6 }}>Tạo tài khoản của bạn chỉ trong vài giây.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="font-body mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-cafe-red" style={{ fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                required
                className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                style={{ fontSize: 13, borderRadius: 0 }}
              />
            </div>

            {/* Name row */}
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Họ
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Nguyễn"
                  required
                  className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                  style={{ fontSize: 13, borderRadius: 0 }}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                  Tên
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Văn A"
                  required
                  className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                  style={{ fontSize: 13, borderRadius: 0 }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                style={{ fontSize: 13, borderRadius: 0 }}
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912 345 678"
                required
                pattern="[0-9]{9,11}"
                className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                style={{ fontSize: 13, borderRadius: 0 }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body text-cafe-primary" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
                  aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map(n => (
                    <div
                      key={n}
                      className="h-1 flex-1 transition-all duration-300"
                      style={{
                        background: password.length >= n * 3
                          ? password.length >= 12 ? "var(--cafe-primary)" : password.length >= 8 ? "#a0633a" : "#d4a96a"
                          : "var(--cafe-accent)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Agree terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none mt-1">
              <div
                onClick={() => setAgreed(!agreed)}
                className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0 mt-0.5"
                style={{
                  borderColor: agreed ? "var(--cafe-primary)" : "#d9d9d9",
                  background: agreed ? "var(--cafe-primary)" : "white",
                }}
              >
                {agreed && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="var(--cafe-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.65)" }}>
                Tôi đồng ý với{" "}
                <Link to="/terms" target="_blank" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>Điều khoản dịch vụ</Link>
                {" "}và{" "}
                <Link to="/privacy" target="_blank" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>Chính sách bảo mật</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!agreed || loading}
              className="font-body w-full py-3.5 mt-2 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "2.5px",
              }}
            >
              {loading ? "ĐANG TẠO..." : "TẠO TÀI KHOẢN"}
            </button>

            {/* Login link */}
            <p className="font-body text-center" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)" }}>
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>
                Đăng nhập
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-cafe-border" />
            <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.4)" }}>Hoặc tiếp tục với</span>
            <div className="flex-1 h-px bg-cafe-border" />
          </div>

          {/* Social */}
          <div className="flex items-center justify-center">
            {googleLoading ? (
              <span className="font-body text-cafe-primary" style={{ fontSize: 13 }}>Đang xử lý...</span>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Đăng ký bằng Google thất bại")}
                theme="outline"
                size="large"
                text="signup_with"
                width="300"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
