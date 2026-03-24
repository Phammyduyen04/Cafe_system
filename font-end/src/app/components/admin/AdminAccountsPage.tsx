import { useEffect, useState, useCallback } from "react";
import {
  adminService,
  type AccountInfo,
  type CreatedAccount,
} from "../../../services/admin.service";
import { staffService } from "../../../services/staff.service";

/* ── Constants ───────────────────────────────────────────── */

const POSITIONS = [
  { value: "STAFF", label: "Nhân viên phục vụ", role: "STAFF" },
  { value: "BARISTA", label: "Barista", role: "STAFF" },
  { value: "CASHIER", label: "Thu ngân", role: "STAFF" },
  { value: "KITCHEN", label: "Bếp", role: "STAFF" },
  { value: "CLEANER", label: "Vệ sinh", role: "STAFF" },
  { value: "SUPERVISOR", label: "Giám sát", role: "MANAGER" },
  { value: "MANAGER", label: "Quản lý", role: "MANAGER" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
  INACTIVE: { bg: "#f3f4f6", text: "#6b7280" },
};

const USER_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Quản lý",
  STAFF: "Nhân viên",
  EMPLOYEE: "Nhân viên",
  CUSTOMER: "Khách hàng",
};

const fmt = (v: string | null | undefined) => v || "—";

/* ══════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════ */

export default function AdminAccountsPage() {
  const [tab, setTab] = useState<"create" | "list">("list");

  return (
    <div>
      <h1
        className="font-heading text-[var(--cafe-primary)] mb-6"
        style={{ fontSize: 28, fontWeight: 700 }}
      >
        Quản lý tài khoản
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[var(--cafe-border)] w-fit mb-6">
        {(
          [
            {
              key: "list",
              label: "Danh sách tài khoản",
              icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
            },
            {
              key: "create",
              label: "Tạo tài khoản tự động",
              icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
            },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-body transition-colors ${
              tab === t.key
                ? "bg-[var(--cafe-primary)] text-white"
                : "text-[var(--cafe-primary)]/60 hover:text-[var(--cafe-primary)] hover:bg-[var(--cafe-bg)]"
            }`}
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <AccountListTab />
      ) : (
        <CreateAccountTab onCreated={() => setTab("list")} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Tab 1 — Danh sách tài khoản
══════════════════════════════════════════════════════════ */

function AccountListTab() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit modal
  const [editingAcc, setEditingAcc] = useState<AccountInfo | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Reset password modal
  const [resetAcc, setResetAcc] = useState<AccountInfo | null>(null);
  const [manualPass, setManualPass] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.listAccounts({
        page,
        limit: 15,
        search: search || undefined,
        userType: filterType || undefined,
        status: filterStatus || undefined,
      });
      setAccounts(res.data ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleToggleStatus = async (acc: AccountInfo) => {
    try {
      await adminService.toggleStatus(acc.accountId);
      showSuccess(
        acc.status === "ACTIVE"
          ? `Đã vô hiệu hoá tài khoản ${acc.username}`
          : `Đã kích hoạt tài khoản ${acc.username}`
      );
      load();
    } catch (err: any) {
      alert(err.message || "Lỗi khi đổi trạng thái");
    }
  };

  const openEdit = (acc: AccountInfo) => {
    setEditingAcc(acc);
    setEditName(acc.fullName || "");
    setEditEmail(acc.email || "");
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editingAcc) return;
    if (!editName.trim()) { setEditError("Họ tên không được để trống"); return; }
    try {
      setEditSaving(true);
      setEditError("");
      await adminService.updateAccount(editingAcc.accountId, {
        fullName: editName.trim(),
        email: editEmail.trim() || undefined,
      });
      showSuccess("Cập nhật tài khoản thành công");
      setEditingAcc(null);
      load();
    } catch (err: any) {
      setEditError(err.message || "Lỗi khi cập nhật");
    } finally {
      setEditSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetAcc) return;
    if (!manualPass || manualPass.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    try {
      setResetting(true);
      await adminService.resetPassword(resetAcc.accountId, manualPass);
      setResetDone(true);
    } catch (err: any) {
      alert(err.message || "Lỗi khi đặt lại mật khẩu");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div>
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm username, tên, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)] flex-1 min-w-[200px]"
          style={{ fontSize: 13 }}
        />
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
          style={{ fontSize: 13 }}
        >
          <option value="">Tất cả loại</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Quản lý</option>
          <option value="STAFF">Nhân viên</option>
          <option value="CUSTOMER">Khách hàng</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
          style={{ fontSize: 13 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đã vô hiệu hoá</option>
        </select>
      </div>

      <p className="font-body text-[var(--cafe-primary)]/50 mb-3" style={{ fontSize: 12 }}>
        {total} tài khoản
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>
            Không tìm thấy tài khoản nào
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Username", "Họ tên", "Email", "Loại", "Quyền", "Trạng thái", "Thao tác"].map((h) => (
                  <th
                    key={h}
                    className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60"
                    style={{ fontSize: 12, fontWeight: 600 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
                const sc = STATUS_COLORS[acc.status] || STATUS_COLORS.INACTIVE;
                const isInactive = acc.status === "INACTIVE";
                return (
                  <tr
                    key={acc.accountId}
                    className="border-b border-[var(--cafe-bg)] last:border-0 transition-colors"
                    style={{ opacity: isInactive ? 0.45 : 1 }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="font-body text-[var(--cafe-primary)]"
                        style={{ fontSize: 13, fontWeight: 600 }}
                      >
                        {acc.username}
                      </span>
                      {acc.isGoogleAccount && (
                        <span className="ml-1 font-body text-blue-500" style={{ fontSize: 10 }}>G</span>
                      )}
                    </td>
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                      {fmt(acc.fullName)}
                    </td>
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12 }}>
                      {fmt(acc.email)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-body px-2 py-0.5 rounded-full bg-[var(--cafe-bg)] text-[var(--cafe-primary)]"
                        style={{ fontSize: 11, fontWeight: 600 }}
                      >
                        {USER_TYPE_LABELS[acc.userType] || acc.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {acc.roles.length > 0 ? acc.roles.map((r) => (
                          <span
                            key={r}
                            className="font-body px-1.5 py-0.5 rounded text-white"
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              backgroundColor:
                                r === "ADMIN" ? "#ef4444" :
                                r === "MANAGER" ? "var(--cafe-primary)" :
                                r === "STAFF" ? "var(--cafe-gold)" :
                                "#9ca3af",
                            }}
                          >
                            {r}
                          </span>
                        )) : (
                          <span className="font-body text-[var(--cafe-primary)]/30" style={{ fontSize: 11 }}>—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-body px-2.5 py-0.5 rounded-full"
                        style={{ fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.text }}
                      >
                        {acc.status === "ACTIVE" ? "Hoạt động" : "Vô hiệu hoá"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openEdit(acc)}
                          className="font-body text-[var(--cafe-gold)] hover:underline"
                          style={{ fontSize: 12 }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={`font-body hover:underline ${acc.status === "ACTIVE" ? "text-[var(--cafe-red)]" : "text-green-600"}`}
                          style={{ fontSize: 12 }}
                        >
                          {acc.status === "ACTIVE" ? "Vô hiệu hoá" : "Kích hoạt"}
                        </button>
                        <button
                          onClick={() => { setResetAcc(acc); setManualPass(""); setResetDone(false); }}
                          className="font-body text-blue-500 hover:underline"
                          style={{ fontSize: 12 }}
                        >
                          Reset MK
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40"
            style={{ fontSize: 13 }}
          >
            Trước
          </button>
          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40"
            style={{ fontSize: 13 }}
          >
            Sau
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingAcc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 20, fontWeight: 700 }}>
              Chỉnh sửa tài khoản
            </h2>
            <p className="font-body text-[var(--cafe-primary)]/50 mb-4" style={{ fontSize: 12 }}>
              @{editingAcc.username}
            </p>
            {editError && (
              <p className="font-body text-[var(--cafe-red)] mb-3" style={{ fontSize: 13 }}>{editError}</p>
            )}
            <div className="space-y-4">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Họ tên
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingAcc(null)}
                className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                {editSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetAcc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setResetAcc(null); setManualPass(""); setResetDone(false); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            {resetDone ? (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="font-heading text-[var(--cafe-primary)] text-center mb-1" style={{ fontSize: 18, fontWeight: 700 }}>
                  Đặt lại thành công
                </h2>
                <p className="font-body text-[var(--cafe-primary)]/60 text-center mb-4" style={{ fontSize: 13 }}>
                  Mật khẩu mới đã được cập nhật cho @{resetAcc.username}
                </p>
                <button
                  onClick={() => { setResetAcc(null); setManualPass(""); setResetDone(false); }}
                  className="font-body w-full py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Đã hiểu, đóng lại
                </button>
              </>
            ) : (
              <>
                <h2 className="font-heading text-[var(--cafe-primary)] mb-2" style={{ fontSize: 20, fontWeight: 700 }}>
                  Đặt lại mật khẩu
                </h2>
                <p className="font-body text-[var(--cafe-primary)]/70 mb-4" style={{ fontSize: 14 }}>
                  Nhập mật khẩu mới cho tài khoản <strong>@{resetAcc.username}</strong>
                </p>
                <div className="mb-6">
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Mật khẩu mới (tối thiểu 6 ký tự)
                  </label>
                  <input
                    type="password"
                    value={manualPass}
                    onChange={(e) => setManualPass(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                    style={{ fontSize: 14 }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setResetAcc(null); setManualPass(""); setResetDone(false); }}
                    className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting || manualPass.length < 6}
                    className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    {resetting ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Tab 2 — Tạo tài khoản tự động
══════════════════════════════════════════════════════════ */

type CreateStep = "form" | "validating" | "success" | "error";

interface FormData {
  fullName: string;
  phoneNumber: string;
  email: string;
  position: string;
  startDate: string;
}

function CreateAccountTab({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState<CreateStep>("form");
  const [form, setForm] = useState<FormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    position: "STAFF",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [createEmployee, setCreateEmployee] = useState(true);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: "" }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.fullName.trim()) errs.fullName = "Họ tên là bắt buộc";
    if (!form.position) errs.position = "Chức vụ là bắt buộc";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Email không hợp lệ";
    }
    if (form.phoneNumber && !/^[0-9+\s\-]{9,15}$/.test(form.phoneNumber)) {
      errs.phoneNumber = "Số điện thoại không hợp lệ";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("validating");
    try {
      const result = await adminService.createStaffAccount({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        position: form.position,
        startDate: form.startDate || undefined,
      });
      setCreated(result);

      // Also create employee record in staff-service
      if (createEmployee) {
        try {
          await staffService.createEmployee({
            fullName: form.fullName.trim(),
            position: form.position,
            employeeType: form.position,
            accountId: result.accountId,
          } as any);
        } catch (err) {
          console.warn("Could not create employee record:", err);
        }
      }

      setStep("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi, vui lòng thử lại");
      setStep("error");
    }
  };

  const reset = () => {
    setStep("form");
    setForm({
      fullName: "",
      phoneNumber: "",
      email: "",
      position: "STAFF",
      startDate: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setCreated(null);
    setErrorMsg("");
  };

  const selectedPos = POSITIONS.find((p) => p.value === form.position);

  /* ── Step: validating ── */
  if (step === "validating") {
    return (
      <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-12 text-center">
        <div className="w-12 h-12 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 600 }}>
          Đang kiểm tra & tạo tài khoản...
        </p>
        <div className="mt-4 space-y-2">
          {[
            "Kiểm tra thông tin nhân viên...",
            "Xác minh email và số điện thoại...",
            "Tạo tên đăng nhập...",
            "Sinh mật khẩu ngẫu nhiên...",
            "Gán quyền theo chức vụ...",
          ].map((s, i) => (
            <p key={i} className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 12 }}>
              {s}
            </p>
          ))}
        </div>
      </div>
    );
  }

  /* ── Step: error ── */
  if (step === "error") {
    return (
      <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-10 text-center max-w-md mx-auto">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 700 }}>
          Không thể tạo tài khoản
        </h2>
        <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
          {errorMsg}
        </p>
        <button
          onClick={() => setStep("form")}
          className="font-body w-full py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          Quay lại và chỉnh sửa
        </button>
      </div>
    );
  }

  /* ── Step: success ── */
  if (step === "success" && created) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 20, fontWeight: 700 }}>
                Tạo tài khoản thành công!
              </h2>
              <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>
                Thông báo thông tin đăng nhập cho nhân viên
              </p>
            </div>
          </div>

          {/* Credentials card */}
          <div
            className="rounded-xl p-4 mb-5 border-2"
            style={{ backgroundColor: "#f0fdf4", borderColor: "#86efac" }}
          >
            <p className="font-body text-green-700 mb-3" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              THÔNG TIN ĐĂNG NHẬP
            </p>
            <div className="space-y-2">
              {[
                { label: "Tên đăng nhập", value: created.username },
                { label: "Mật khẩu", value: created.password, mono: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="font-body text-green-700/70" style={{ fontSize: 12 }}>{row.label}</span>
                  <span
                    className="font-body text-green-800 select-all"
                    style={{ fontSize: row.mono ? 16 : 14, fontWeight: 700, letterSpacing: row.mono ? 1 : 0 }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Employee info */}
          <div className="bg-[var(--cafe-bg)] rounded-xl p-4 mb-5">
            <p className="font-body text-[var(--cafe-primary)]/50 mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
              THÔNG TIN NHÂN VIÊN
            </p>
            <div className="space-y-1.5">
              {[
                { label: "Họ tên", value: created.fullName },
                { label: "Email", value: created.email || "—" },
                { label: "Chức vụ", value: created.position },
                { label: "Quyền hạn", value: created.role },
                { label: "Loại tài khoản", value: created.userType },
                ...(created.startDate ? [{ label: "Ngày bắt đầu", value: created.startDate }] : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 12 }}>{row.label}</span>
                  <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-body text-[var(--cafe-primary)]/50 text-center mb-4" style={{ fontSize: 12 }}>
            Nhân viên có thể đổi mật khẩu sau khi đăng nhập lần đầu
          </p>

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="font-body flex-1 py-3 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]"
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              Tạo tài khoản khác
            </button>
            <button
              onClick={onCreated}
              className="font-body flex-1 py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90"
              style={{ fontSize: 14, fontWeight: 600 }}
            >
              Xem danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Step: form ── */
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-6">
        <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 20, fontWeight: 700 }}>
          Thông tin nhân viên
        </h2>
        <p className="font-body text-[var(--cafe-primary)]/50 mb-6" style={{ fontSize: 13 }}>
          Hệ thống sẽ tự động tạo tên đăng nhập và mật khẩu
        </p>

        <div className="space-y-4">
          {/* Full name */}
          <Field
            label="Họ tên *"
            error={errors.fullName}
            input={
              <input
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="Nguyễn Văn A"
                className={inputCls(!!errors.fullName)}
              />
            }
          />

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Số điện thoại"
              error={errors.phoneNumber}
              input={
                <input
                  value={form.phoneNumber}
                  onChange={set("phoneNumber")}
                  placeholder="0901234567"
                  className={inputCls(!!errors.phoneNumber)}
                />
              }
            />
            <Field
              label="Email"
              error={errors.email}
              input={
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="nhanvien@coffea.vn"
                  className={inputCls(!!errors.email)}
                />
              }
            />
          </div>

          {/* Position */}
          <Field
            label="Chức vụ *"
            error={errors.position}
            input={
              <select
                value={form.position}
                onChange={set("position")}
                className={inputCls(!!errors.position)}
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            }
          />


          {/* Start date */}
          <Field
            label="Ngày bắt đầu"
            input={
              <input
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
                className={inputCls(false)}
              />
            }
          />

          {/* Auto create employee record */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={createEmployee}
              onChange={(e) => setCreateEmployee(e.target.checked)}
              className="accent-[var(--cafe-gold)] w-4 h-4"
            />
            <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
              Tự động tạo hồ sơ nhân viên trong hệ thống nhân sự
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="font-body w-full mt-6 py-3 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          Kiểm tra & Tạo tài khoản
        </button>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function Field({
  label,
  error,
  input,
}: {
  label: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
        {label}
      </label>
      {input}
      {error && (
        <p className="font-body text-[var(--cafe-red)] mt-1" style={{ fontSize: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  `font-body w-full px-4 py-2.5 border rounded-lg focus:outline-none transition-colors ${
    hasError
      ? "border-[var(--cafe-red)] focus:border-[var(--cafe-red)]"
      : "border-[var(--cafe-border)] focus:border-[var(--cafe-gold)]"
  }`;
