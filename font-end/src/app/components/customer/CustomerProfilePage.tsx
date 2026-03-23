import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { customerService, type Customer } from "../../../services/customer.service";

export default function CustomerProfilePage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadCustomer();
  }, [isLoggedIn]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");
      let data: Customer;
      try {
        data = await customerService.getByAccountId(user!.accountId);
      } catch {
        // Customer chưa tồn tại — tự tạo từ thông tin auth
        await customerService.createFromAuth({
          fullName: user!.fullName || user!.username,
          accountId: user!.accountId,
        });
        data = await customerService.getByAccountId(user!.accountId);
      }
      setCustomer(data);
      setEditName(data.full_name);
      setEditEmail(data.email ?? "");
      setEditPhone(data.phone_number ?? "");
    } catch {
      setError("Không tìm thấy thông tin khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await customerService.updateMyProfile({
        fullName: editName,
        email: editEmail || undefined,
        phoneNumber: editPhone || undefined,
      });
      setEditOpen(false);
      setSuccessMsg("Cập nhật thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadCustomer();
    } catch (err: any) {
      setError(err.message || "Lỗi khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await customerService.deleteMyAccount();
      logout();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa tài khoản");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cafe-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 text-center">
          <p className="font-body text-[var(--cafe-primary)]">{error || "Không tìm thấy thông tin"}</p>
        </div>
      </div>
    );
  }

  const vipProgress = Math.min((customer.points / 200) * 100, 100);

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 py-12">

        {/* Success message */}
        {successMsg && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-[var(--cafe-accent)] flex items-center justify-center shrink-0">
            <span className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 32, fontWeight: 700 }}>
              {customer.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>
              {customer.full_name}
            </h1>
            <span
              className="font-body inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: customer.customer_type === "VIP" ? "var(--cafe-gold)" : "var(--cafe-border)",
                color: customer.customer_type === "VIP" ? "#fff" : "var(--cafe-primary)",
              }}
            >
              {customer.customer_type}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[var(--cafe-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 20, fontWeight: 600 }}>
              Thông tin cá nhân
            </h2>
            <button
              onClick={() => setEditOpen(true)}
              className="font-body px-4 py-2 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              Chỉnh sửa
            </button>
          </div>
          <div className="space-y-3">
            <InfoRow label="Họ tên" value={customer.full_name} />
            <InfoRow label="Email" value={customer.email || "Chưa cập nhật"} />
            <InfoRow label="Số điện thoại" value={customer.phone_number || "Chưa cập nhật"} />
            <InfoRow label="Trạng thái" value={customer.customer_status} />
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[var(--cafe-border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 20, fontWeight: 600 }}>
              Điểm tích lũy
            </h2>
            <Link
              to="/profile/points"
              className="font-body text-[var(--cafe-gold)] hover:underline"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              Xem chi tiết →
            </Link>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>
              {customer.points}
            </span>
            <span className="font-body text-[var(--cafe-primary)]/50 mb-1" style={{ fontSize: 14 }}>điểm</span>
          </div>
          <div className="mb-2">
            <div className="w-full h-3 bg-[var(--cafe-bg)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${vipProgress}%`, backgroundColor: "var(--cafe-gold)" }}
              />
            </div>
          </div>
          <p className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 12 }}>
            {customer.customer_type === "VIP"
              ? "Bạn là thành viên VIP!"
              : `Còn ${200 - customer.points} điểm nữa để lên VIP`}
          </p>
        </div>

        {/* Delete Account */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--cafe-red)]/20">
          <h2 className="font-heading text-[var(--cafe-red)]" style={{ fontSize: 18, fontWeight: 600 }}>
            Xóa tài khoản
          </h2>
          <p className="font-body text-[var(--cafe-primary)]/60 mt-1 mb-4" style={{ fontSize: 13 }}>
            Thao tác này sẽ vô hiệu hóa tài khoản của bạn. Dữ liệu sẽ không bị xóa hoàn toàn.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="font-body px-4 py-2 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            Xóa tài khoản
          </button>
        </div>

        {/* Edit Dialog */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditOpen(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
                Chỉnh sửa thông tin
              </h2>
              {error && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Họ tên</label>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Số điện thoại</label>
                  <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditOpen(false)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] transition-colors" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
                <button onClick={handleSave} disabled={saving} className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        {deleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteOpen(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Xác nhận xóa tài khoản</h2>
              <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
                Bạn có chắc muốn xóa tài khoản? Thao tác này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteOpen(false)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
                <button onClick={handleDelete} disabled={saving} className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                  {saving ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-2 border-b border-[var(--cafe-bg)]">
      <span className="font-body text-[var(--cafe-primary)]/50 w-36 shrink-0" style={{ fontSize: 13 }}>{label}</span>
      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
