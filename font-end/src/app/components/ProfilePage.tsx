import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, type AuthUser } from "../../contexts/AuthContext";
import { authService } from "../../services/auth.service";

export default function ProfilePage() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const data = await authService.getMe();
        setProfile(data);
      } catch {
        setError("Không thể tải thông tin tài khoản.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isLoggedIn, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    setPwError("");

    if (newPassword.length < 6) {
      setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPwLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setPwMsg("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setPwError(err?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-3 border-cafe-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center pt-24">
        <p className="font-body text-cafe-red">{error}</p>
      </div>
    );
  }

  const data = profile || user;

  return (
    <div className="min-h-screen bg-cafe-bg pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-cafe-primary flex items-center justify-center mx-auto mb-4">
            <span className="font-heading text-white" style={{ fontSize: 32, fontWeight: 700 }}>
              {data?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <h1 className="font-heading text-cafe-primary" style={{ fontSize: 28, fontWeight: 700 }}>
            Hồ so tài khoản
          </h1>
        </div>

        {/* Profile info card */}
        <div className="bg-white rounded-2xl shadow-md border border-cafe-accent overflow-hidden">
          <div className="px-6 py-5 border-b border-cafe-accent bg-cafe-primary/5">
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: 18, fontWeight: 600 }}>
              Thông tin cá nhân
            </h2>
          </div>

          <div className="divide-y divide-cafe-accent/50">
            <ProfileRow label="Tên đăng nhập" value={data?.username} />
            <ProfileRow label="Họ và tên" value={data?.fullName} />
            <ProfileRow label="Email" value={data?.email} />
            <ProfileRow label="Trạng thái" value={profileStatusLabel(profile?.status)} />
          </div>
        </div>

        {/* Change password section */}
        <div className="bg-white rounded-2xl shadow-md border border-cafe-accent overflow-hidden mt-6">
          {profile?.isGoogleAccount && !profile?.hasPassword ? (
            <div className="px-6 py-5">
              <h2 className="font-heading text-cafe-primary mb-3" style={{ fontSize: 18, fontWeight: 600 }}>
                Đổi mật khẩu
              </h2>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="font-body text-amber-800" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Tài khoản này đăng nhập bằng Google. Vui lòng quản lý mật khẩu qua{" "}
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold hover:text-amber-900 transition-colors"
                  >
                    tài khoản Google
                  </a>{" "}
                  của bạn.
                </p>
              </div>
            </div>
          ) : (
          <>
          <button
            className="w-full flex items-center justify-between px-6 py-5 hover:bg-cafe-bg/50 transition-colors"
            onClick={() => setShowChangePassword(!showChangePassword)}
          >
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: 18, fontWeight: 600 }}>
              Đổi mật khẩu
            </h2>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cafe-primary/50 transition-transform duration-200"
              style={{ transform: showChangePassword ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="px-6 pb-6 space-y-4">
              <div>
                <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 13 }}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 13 }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 13 }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                  style={{ fontSize: 14 }}
                />
              </div>

              {pwError && (
                <p className="font-body text-cafe-red" style={{ fontSize: 13 }}>{pwError}</p>
              )}
              {pwMsg && (
                <p className="font-body text-green-600" style={{ fontSize: 13 }}>{pwMsg}</p>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="font-body w-full py-2.5 bg-cafe-primary text-white rounded-xl hover:bg-cafe-primary/90 transition-colors disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                {pwLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </form>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="font-body text-cafe-primary/60" style={{ fontSize: 13 }}>
        {label}
      </span>
      <span className="font-body text-cafe-primary text-right" style={{ fontSize: 14, fontWeight: 500 }}>
        {value || "—"}
      </span>
    </div>
  );
}

function profileStatusLabel(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Ngưng hoạt động";
    default:
      return status || "—";
  }
}
