import { useState, useEffect, useCallback } from "react";
import { adminService, type AccountInfo, type RoleInfo } from "../../../services/admin.service";

export default function AdminRolesPage() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<AccountInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listAccounts({ page, limit: 15, search: search || undefined });
      setAccounts(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch {
      showToast("error", "Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await adminService.getRoles();
      setRoles(data);
    } catch {
      showToast("error", "Không thể tải danh sách quyền");
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchRoles(); }, []);

  const handleAssign = async (accountId: string, roleId: string, roleName: string) => {
    const key = `assign-${accountId}-${roleId}`;
    setActionLoading(key);
    try {
      await adminService.assignRole(accountId, roleId);
      showToast("success", `Đã cấp quyền ${roleName}`);
      // Update local state
      setAccounts(prev => prev.map(a => {
        if (a.accountId !== accountId) return a;
        return { ...a, roles: [...a.roles, roleName] };
      }));
      if (selectedAccount?.accountId === accountId) {
        setSelectedAccount(prev => prev ? { ...prev, roles: [...prev.roles, roleName] } : null);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Cấp quyền thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (accountId: string, roleId: string, roleName: string) => {
    const key = `revoke-${accountId}-${roleId}`;
    setActionLoading(key);
    try {
      await adminService.revokeRole(accountId, roleId);
      showToast("success", `Đã thu hồi quyền ${roleName}`);
      setAccounts(prev => prev.map(a => {
        if (a.accountId !== accountId) return a;
        return { ...a, roles: a.roles.filter(r => r !== roleName) };
      }));
      if (selectedAccount?.accountId === accountId) {
        setSelectedAccount(prev => prev ? { ...prev, roles: prev.roles.filter(r => r !== roleName) } : null);
      }
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Thu hồi quyền thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700 border-red-200",
    MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
    STAFF: "bg-blue-100 text-blue-700 border-blue-200",
    CUSTOMER: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg font-body text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 26, fontWeight: 700 }}>
          Phân quyền
        </h1>
        <p className="font-body mt-1" style={{ fontSize: 13, color: "rgba(48,38,28,0.55)" }}>
          Gán và thu hồi quyền cho các tài khoản trong hệ thống
        </p>
      </div>

      <div className="flex gap-6">
        {/* Left: account list */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tài khoản..."
                className="font-body w-full border border-[var(--cafe-border)] bg-white pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-[var(--cafe-primary)] transition-colors"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[var(--cafe-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p className="font-body text-sm" style={{ color: "rgba(48,38,28,0.4)" }}>Không tìm thấy tài khoản</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--cafe-border)]" style={{ backgroundColor: "var(--cafe-bg)" }}>
                    {["Tài khoản", "Loại", "Quyền hiện tại", ""].map(h => (
                      <th key={h} className="font-body text-left px-4 py-3" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(48,38,28,0.5)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr
                      key={acc.accountId}
                      className={`border-b border-[var(--cafe-border)] last:border-0 hover:bg-[var(--cafe-bg)] transition-colors cursor-pointer ${
                        selectedAccount?.accountId === acc.accountId ? "bg-amber-50" : ""
                      }`}
                      style={{ opacity: acc.status === "INACTIVE" ? 0.45 : 1 }}
                      onClick={() => setSelectedAccount(acc.accountId === selectedAccount?.accountId ? null : acc)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-body font-semibold" style={{ fontSize: 13, color: "var(--cafe-primary)" }}>{acc.fullName || acc.username}</p>
                        <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)" }}>{acc.username}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body px-2 py-0.5 rounded-full text-xs font-medium border" style={{
                          backgroundColor: acc.userType === "ADMIN" ? "#fee2e2" : acc.userType === "MANAGER" ? "#f3e8ff" : acc.userType === "STAFF" ? "#dbeafe" : "#dcfce7",
                          color: acc.userType === "ADMIN" ? "#b91c1c" : acc.userType === "MANAGER" ? "#7e22ce" : acc.userType === "STAFF" ? "#1d4ed8" : "#15803d",
                          borderColor: acc.userType === "ADMIN" ? "#fca5a5" : acc.userType === "MANAGER" ? "#d8b4fe" : acc.userType === "STAFF" ? "#93c5fd" : "#86efac",
                        }}>
                          {acc.userType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {acc.roles.length === 0 ? (
                            <span className="font-body text-xs" style={{ color: "rgba(48,38,28,0.35)" }}>Chưa có quyền</span>
                          ) : acc.roles.map(r => (
                            <span key={r} className={`font-body px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[r] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedAccount(acc.accountId === selectedAccount?.accountId ? null : acc); }}
                          className="font-body text-xs font-medium transition-colors"
                          style={{ color: "var(--cafe-primary)" }}
                        >
                          {selectedAccount?.accountId === acc.accountId ? "Đóng ▲" : "Phân quyền ▼"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-body px-3 py-1.5 rounded-lg border border-[var(--cafe-border)] text-sm disabled:opacity-40 hover:border-[var(--cafe-primary)] transition-colors"
              >
                ← Trước
              </button>
              <span className="font-body text-sm" style={{ color: "rgba(48,38,28,0.6)" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="font-body px-3 py-1.5 rounded-lg border border-[var(--cafe-border)] text-sm disabled:opacity-40 hover:border-[var(--cafe-primary)] transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </div>

        {/* Right: role assignment panel */}
        {selectedAccount && (
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-5 sticky top-6">
              {/* Account info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-body font-semibold" style={{ fontSize: 14, color: "var(--cafe-primary)" }}>
                    {selectedAccount.fullName || selectedAccount.username}
                  </p>
                  <p className="font-body mt-0.5" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>
                    @{selectedAccount.username}
                  </p>
                  {selectedAccount.email && (
                    <p className="font-body mt-0.5" style={{ fontSize: 11, color: "rgba(48,38,28,0.4)" }}>
                      {selectedAccount.email}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedAccount(null)} className="p-1 hover:opacity-60 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="h-px bg-[var(--cafe-border)] mb-4" />

              {/* Roles */}
              <p className="font-body font-semibold mb-3" style={{ fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(48,38,28,0.5)" }}>
                Danh sách quyền
              </p>

              {rolesLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-[var(--cafe-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {roles.map(role => {
                    const hasRole = selectedAccount.roles.includes(role.role_name);
                    const assignKey = `assign-${selectedAccount.accountId}-${role.role_id}`;
                    const revokeKey = `revoke-${selectedAccount.accountId}-${role.role_id}`;
                    const isLoading = actionLoading === assignKey || actionLoading === revokeKey;

                    return (
                      <div
                        key={role.role_id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          hasRole
                            ? "border-[var(--cafe-gold)] bg-amber-50"
                            : "border-[var(--cafe-border)] bg-white"
                        }`}
                      >
                        <div>
                          <span className={`font-body font-semibold text-sm ${ROLE_COLORS[role.role_name]?.split(" ")[1] || "text-gray-700"}`}>
                            {role.role_name}
                          </span>
                          {role.description && (
                            <p className="font-body mt-0.5" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>
                              {role.description}
                            </p>
                          )}
                        </div>

                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-[var(--cafe-primary)] border-t-transparent rounded-full animate-spin" />
                        ) : hasRole ? (
                          <button
                            onClick={() => handleRevoke(selectedAccount.accountId, role.role_id, role.role_name)}
                            className="font-body text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAssign(selectedAccount.accountId, role.role_id, role.role_name)}
                            className="font-body text-xs font-medium px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                          >
                            Cấp quyền
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="h-px bg-[var(--cafe-border)] my-4" />

              <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.4)", lineHeight: 1.5 }}>
                Thay đổi quyền có hiệu lực ngay lập tức. Tài khoản cần đăng xuất và đăng nhập lại để áp dụng.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
