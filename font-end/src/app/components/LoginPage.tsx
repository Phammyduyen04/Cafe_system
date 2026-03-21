import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LOGIN_BG, GOOGLE_LOGO } from "../../constants/images";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      login(res.accessToken, res.refreshToken, res.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
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
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-body text-cafe-primary" style={{ fontSize: 36, fontWeight: 700, marginTop: 20, letterSpacing: "1px" }}>Đăng nhập</h1>
            <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.55)", marginTop: 6 }}>Chào mừng trở lại! Đăng nhập để tiếp tục.</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="font-body mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-cafe-red" style={{ fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  placeholder="••••••••"
                  required
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
            </div>

            {/* Keep logged in + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                  className="w-5 h-5 border flex items-center justify-center transition-colors shrink-0"
                  style={{
                    borderColor: keepLoggedIn ? "var(--cafe-primary)" : "#d9d9d9",
                    background: keepLoggedIn ? "var(--cafe-primary)" : "white",
                  }}
                >
                  {keepLoggedIn && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7.5L10 1" stroke="var(--cafe-bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.65)" }}>Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" className="font-body text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontSize: 12, textDecoration: "underline" }}>
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="font-body w-full py-3.5 mt-2 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "2.5px",
              }}
            >
              {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            </button>

            {/* Sign up link */}
            <p className="font-body text-center" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)" }}>
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>
                Đăng ký ngay
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-cafe-border" />
            <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.4)" }}>Hoặc tiếp tục với</span>
            <div className="flex-1 h-px bg-cafe-border" />
          </div>

          {/* Social login */}
          <div className="flex items-center justify-center">
            <button
              className="flex items-center gap-3 px-6 py-3 border border-cafe-border bg-white hover:border-cafe-primary transition-colors"
              aria-label="Google"
              style={{ borderRadius: 0 }}
            >
              <img src={GOOGLE_LOGO} alt="Google" className="w-5 h-5 object-contain" />
              <span className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 500 }}>
                Tiếp tục với Google
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
