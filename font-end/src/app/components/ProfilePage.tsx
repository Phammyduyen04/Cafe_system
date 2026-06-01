import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, type AuthUser } from "../../contexts/AuthContext";
import { authService } from "../../services/auth.service";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function avatarSrc(avatar?: string | null) {
  if (!avatar) return null;
  return avatar.startsWith("http") ? avatar : `${BASE_URL}${avatar}`;
}

export default function ProfilePage() {
  const { isLoggedIn, user, login: setAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    authService.getMe()
      .then(data => { setProfile(data); })
      .catch(() => setError("Không thể tải thông tin tài khoản."))
      .finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  const startEdit = () => {
    setEditName(profile?.fullName ?? "");
    setEditEmail(profile?.email ?? "");
    setSaveMsg("");
    setSaveError("");
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setSaveError(""); };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(""); setSaveMsg("");
    setSaveLoading(true);
    try {
      const updated = await authService.updateProfile({
        fullName: editName.trim() || undefined,
        email: editEmail.trim() || undefined,
      });
      const newProfile = { ...profile!, ...updated };
      setProfile(newProfile);
      // Sync localStorage user
      const token = localStorage.getItem("accessToken")!;
      const refreshToken = localStorage.getItem("refreshToken")!;
      setAuth(token, refreshToken, { ...user!, fullName: updated.fullName, email: updated.email });
      setSaveMsg("Cập nhật thành công!");
      setEditing(false);
    } catch (err: any) {
      setSaveError(err?.message || "Cập nhật thất bại.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const res = await authService.uploadAvatar(file);
      const newAvatar = res.data?.avatar;
      setProfile(p => p ? { ...p, avatar: newAvatar } : p);
      const token = localStorage.getItem("accessToken")!;
      const refreshToken = localStorage.getItem("refreshToken")!;
      setAuth(token, refreshToken, { ...user!, avatar: newAvatar });
    } catch (err: any) {
      alert(err?.message || "Tải ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setAvatarLoading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(""); setPwError("");
    if (newPassword.length < 6) { setPwError("Mật khẩu mới phải có ít nhất 6 ký tự."); return; }
    if (newPassword !== confirmPassword) { setPwError("Mật khẩu xác nhận không khớp."); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setPwMsg("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { logout(); navigate("/login"); }, 2000);
    } catch (err: any) {
      setPwError(err?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center pt-24">
      <div className="w-8 h-8 border-3 border-cafe-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-cafe-bg flex items-center justify-center pt-24">
      <p className="font-body text-cafe-red">{error}</p>
    </div>
  );

  const data = profile || user;
  const src = avatarSrc(data?.avatar);
  const initial = data?.username?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-cafe-bg pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <button
              className="w-20 h-20 rounded-full overflow-hidden bg-cafe-primary flex items-center justify-center mx-auto border-2 border-cafe-accent hover:opacity-90 transition-opacity"
              onClick={() => avatarInputRef.current?.click()}
              title="Đổi ảnh đại diện"
              disabled={avatarLoading}
            >
              {src ? (
                <img src={src} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading text-white" style={{ fontSize: 32, fontWeight: 700 }}>{initial}</span>
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-cafe-primary border-2 border-white flex items-center justify-center pointer-events-none">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="font-body text-cafe-primary/50 mt-2" style={{ fontSize: 11 }}>Nhấn vào ảnh để đổi avatar</p>
          <h1 className="font-heading text-cafe-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>
            Hồ sơ tài khoản
          </h1>
        </div>

        {/* Profile info card */}
        <div className="bg-white rounded-2xl shadow-md border border-cafe-accent overflow-hidden">
          <div className="px-6 py-5 border-b border-cafe-accent bg-cafe-primary/5 flex items-center justify-between">
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: 18, fontWeight: 600 }}>Thông tin cá nhân</h2>
            {!editing && (
              <button onClick={startEdit} className="font-body flex items-center gap-1.5 px-3 py-1.5 border border-cafe-primary text-cafe-primary hover:bg-cafe-primary hover:text-white transition-colors" style={{ fontSize: 12, fontWeight: 600 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Chỉnh sửa
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} className="px-6 py-5 space-y-4">
              <div>
                <label className="font-body block mb-1 text-cafe-primary/60" style={{ fontSize: 12 }}>Tên đăng nhập</label>
                <p className="font-body text-cafe-primary/50 px-3 py-2 bg-cafe-bg rounded-xl" style={{ fontSize: 14 }}>{data?.username}</p>
              </div>
              <div>
                <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 12 }}>Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                  style={{ fontSize: 14 }}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 12 }}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                  style={{ fontSize: 14 }}
                  placeholder="Nhập email"
                />
              </div>
              {saveError && <p className="font-body text-red-500" style={{ fontSize: 13 }}>{saveError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saveLoading} className="font-body px-5 py-2.5 bg-cafe-primary text-white rounded-xl hover:bg-cafe-primary/90 transition-colors disabled:opacity-50" style={{ fontSize: 13, fontWeight: 600 }}>
                  {saveLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button type="button" onClick={cancelEdit} className="font-body px-5 py-2.5 border border-cafe-accent text-cafe-primary rounded-xl hover:bg-cafe-bg transition-colors" style={{ fontSize: 13 }}>
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="divide-y divide-cafe-accent/50">
              {saveMsg && (
                <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                  <p className="font-body text-green-600" style={{ fontSize: 13 }}>{saveMsg}</p>
                </div>
              )}
              <ProfileRow label="Tên đăng nhập" value={data?.username} />
              <ProfileRow label="Họ và tên" value={data?.fullName} />
              <ProfileRow label="Email" value={data?.email} />
              <ProfileRow label="Trạng thái" value={profileStatusLabel(profile?.status)} />
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-md border border-cafe-accent overflow-hidden mt-6">
          {profile?.isGoogleAccount && !profile?.hasPassword ? (
            <div className="px-6 py-5">
              <h2 className="font-heading text-cafe-primary mb-3" style={{ fontSize: 18, fontWeight: 600 }}>Đổi mật khẩu</h2>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="font-body text-amber-800" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Tài khoản này đăng nhập bằng Google. Vui lòng quản lý mật khẩu qua{" "}
                  <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-900 transition-colors">tài khoản Google</a> của bạn.
                </p>
              </div>
            </div>
          ) : (
            <>
              <button className="w-full flex items-center justify-between px-6 py-5 hover:bg-cafe-bg/50 transition-colors" onClick={() => setShowChangePassword(!showChangePassword)}>
                <h2 className="font-heading text-cafe-primary" style={{ fontSize: 18, fontWeight: 600 }}>Đổi mật khẩu</h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cafe-primary/50 transition-transform duration-200" style={{ transform: showChangePassword ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="px-6 pb-6 space-y-4">
                  {[
                    { label: "Mật khẩu hiện tại", value: oldPassword, set: setOldPassword },
                    { label: "Mật khẩu mới", value: newPassword, set: setNewPassword },
                    { label: "Xác nhận mật khẩu mới", value: confirmPassword, set: setConfirmPassword },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="font-body block mb-1 text-cafe-primary/70" style={{ fontSize: 13 }}>{label}</label>
                      <input type="password" value={value} onChange={e => set(e.target.value)} required
                        className="font-body w-full px-4 py-2.5 rounded-xl border border-cafe-accent focus:border-cafe-primary focus:ring-1 focus:ring-cafe-primary outline-none transition-colors"
                        style={{ fontSize: 14 }} />
                    </div>
                  ))}
                  {pwError && <p className="font-body text-cafe-red" style={{ fontSize: 13 }}>{pwError}</p>}
                  {pwMsg && <p className="font-body text-green-600" style={{ fontSize: 13 }}>{pwMsg}</p>}
                  <button type="submit" disabled={pwLoading} className="font-body w-full py-2.5 bg-cafe-primary text-white rounded-xl hover:bg-cafe-primary/90 transition-colors disabled:opacity-50" style={{ fontSize: 14, fontWeight: 600 }}>
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
      <span className="font-body text-cafe-primary/60" style={{ fontSize: 13 }}>{label}</span>
      <span className="font-body text-cafe-primary text-right" style={{ fontSize: 14, fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

function profileStatusLabel(status?: string) {
  switch (status) {
    case "ACTIVE": return "Đang hoạt động";
    case "INACTIVE": return "Ngưng hoạt động";
    default: return status || "—";
  }
}
