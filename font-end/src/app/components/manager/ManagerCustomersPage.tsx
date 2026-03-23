import { useEffect, useState } from "react";
import { customerService, type Customer, type PointLog } from "../../../services/customer.service";

export default function ManagerCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Detail dialog
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailLogs, setDetailLogs] = useState<PointLog[]>([]);

  // Adjust points dialog
  const [adjustCustomer, setAdjustCustomer] = useState<Customer | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll(page, 10, search || undefined);
      const data = res as any;
      setCustomers(Array.isArray(data) ? data : data?.data ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const openDetail = async (cust: Customer) => {
    setDetailCustomer(cust);
    try {
      const logs = await customerService.getPointLogs(cust.customer_id);
      setDetailLogs(Array.isArray(logs) ? logs : []);
    } catch {
      setDetailLogs([]);
    }
  };

  const openAdjust = (cust: Customer) => {
    setAdjustCustomer(cust);
    setAdjustPoints("");
    setAdjustReason("");
    setAdjustError("");
  };

  const handleAdjust = async () => {
    if (!adjustCustomer) return;
    const pts = parseInt(adjustPoints);
    if (isNaN(pts) || pts === 0) { setAdjustError("Nhập số điểm hợp lệ (khác 0)"); return; }
    try {
      setAdjustSaving(true);
      setAdjustError("");
      await customerService.adjustPoints(adjustCustomer.customer_id, pts, adjustReason || undefined);
      setAdjustCustomer(null);
      setSuccessMsg("Điều chỉnh điểm thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadCustomers();
    } catch (err: any) {
      setAdjustError(err.message || "Lỗi khi điều chỉnh");
    } finally {
      setAdjustSaving(false);
    }
  };

  const typeBadge = (type: string) => {
    const isVip = type === "VIP";
    return (
      <span
        className="font-body inline-block px-2 py-0.5 rounded-full"
        style={{ fontSize: 11, fontWeight: 600, backgroundColor: isVip ? "var(--cafe-gold)" : "var(--cafe-border)", color: isVip ? "#fff" : "var(--cafe-primary)" }}
      >
        {type}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const active = status === "ACTIVE";
    return (
      <span
        className="font-body inline-block px-2 py-0.5 rounded-full"
        style={{ fontSize: 11, fontWeight: 600, backgroundColor: active ? "#dcfce7" : "#fef2f2", color: active ? "#16a34a" : "#dc2626" }}
      >
        {status}
      </span>
    );
  };

  return (
    <div>
      <h1 className="font-heading text-[var(--cafe-primary)] mb-6" style={{ fontSize: 28, fontWeight: 700 }}>
        Quản lý khách hàng
      </h1>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Tìm kiếm theo tên, email, SĐT..."
          className="font-body flex-1 px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
          style={{ fontSize: 13 }}
        />
        <button
          onClick={handleSearch}
          className="font-body px-5 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          Tìm
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Không tìm thấy khách hàng</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên", "Email", "SĐT", "Điểm", "Loại", "Trạng thái", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customer_id} className="border-b border-[var(--cafe-bg)] last:border-0">
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{c.full_name}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{c.email || "—"}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{c.phone_number || "—"}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>{c.points}</td>
                  <td className="px-4 py-3">{typeBadge(c.customer_type)}</td>
                  <td className="px-4 py-3">{statusBadge(c.customer_status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openDetail(c)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Chi tiết</button>
                      <button onClick={() => openAdjust(c)} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>Điều chỉnh điểm</button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Detail Dialog */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailCustomer(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
              {detailCustomer.full_name}
            </h2>
            <div className="space-y-2 mb-4">
              <DetailRow label="Email" value={detailCustomer.email || "—"} />
              <DetailRow label="SĐT" value={detailCustomer.phone_number || "—"} />
              <DetailRow label="Điểm" value={String(detailCustomer.points)} />
              <DetailRow label="Loại" value={detailCustomer.customer_type} />
              <DetailRow label="Trạng thái" value={detailCustomer.customer_status} />
            </div>

            <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>
              Lịch sử điểm ({detailLogs.length})
            </h3>
            {detailLogs.length === 0 ? (
              <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>Chưa có lịch sử</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--cafe-bg)]">
                      <th className="font-body text-left px-2 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>Ngày</th>
                      <th className="font-body text-left px-2 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>Loại</th>
                      <th className="font-body text-right px-2 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>Điểm</th>
                      <th className="font-body text-left px-2 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailLogs.map((log) => (
                      <tr key={log.point_log_id} className="border-b border-[var(--cafe-bg)] last:border-0">
                        <td className="font-body px-2 py-2" style={{ fontSize: 12 }}>{new Date(log.created_at).toLocaleDateString("vi-VN")}</td>
                        <td className="px-2 py-2">
                          <span className="font-body px-1.5 py-0.5 rounded-full" style={{
                            fontSize: 10, fontWeight: 600,
                            backgroundColor: log.change_type === "EARN" ? "#dcfce7" : log.change_type === "REDEEM" ? "#fef2f2" : "#fef9c3",
                            color: log.change_type === "EARN" ? "#16a34a" : log.change_type === "REDEEM" ? "#dc2626" : "#ca8a04",
                          }}>
                            {log.change_type}
                          </span>
                        </td>
                        <td className="font-body text-right px-2 py-2" style={{ fontSize: 12, fontWeight: 600, color: log.points_changed > 0 ? "#16a34a" : "#dc2626" }}>
                          {log.points_changed > 0 ? "+" : ""}{log.points_changed}
                        </td>
                        <td className="font-body px-2 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 12 }}>{log.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={() => setDetailCustomer(null)} className="font-body w-full mt-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Adjust Points Dialog */}
      {adjustCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAdjustCustomer(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 20, fontWeight: 600 }}>
              Điều chỉnh điểm
            </h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-4" style={{ fontSize: 13 }}>
              {adjustCustomer.full_name} — Hiện tại: {adjustCustomer.points} điểm
            </p>
            {adjustError && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{adjustError}</p>}
            <div className="space-y-3 mb-5">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Số điểm (+/-)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  placeholder="VD: 50 hoặc -20"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14 }}
                />
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Lý do</label>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Lý do điều chỉnh..."
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAdjustCustomer(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleAdjust} disabled={adjustSaving} className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {adjustSaving ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-body text-[var(--cafe-primary)]/50 w-24 shrink-0" style={{ fontSize: 13 }}>{label}:</span>
      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
