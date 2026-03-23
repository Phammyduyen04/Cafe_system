import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { customerService, type Customer, type PointLog } from "../../../services/customer.service";

export default function CustomerPointsPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const cust = await customerService.getByAccountId(user!.accountId);
      setCustomer(cust);
      const pointLogs = await customerService.getPointLogs(cust.customer_id);
      setLogs(Array.isArray(pointLogs) ? pointLogs : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cafe-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
      <div className="max-w-[800px] mx-auto px-6 md:px-12 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/profile" className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 13 }}>Tài khoản</Link>
          <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>/</span>
          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>Điểm tích lũy</span>
        </div>

        {/* Points summary */}
        <div className="bg-white rounded-2xl p-6 mb-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/60 mb-1" style={{ fontSize: 14 }}>Tổng điểm hiện tại</p>
          <p className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>
            {customer?.points ?? 0}
          </p>
          <span
            className="font-body inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: customer?.customer_type === "VIP" ? "var(--cafe-gold)" : "var(--cafe-border)",
              color: customer?.customer_type === "VIP" ? "#fff" : "var(--cafe-primary)",
            }}
          >
            {customer?.customer_type}
          </span>
        </div>

        {/* Point logs */}
        <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
          Lịch sử điểm
        </h2>

        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
            <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Chưa có lịch sử điểm</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--cafe-bg)]">
                  <th className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>Ngày</th>
                  <th className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>Loại</th>
                  <th className="font-body text-right px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>Điểm</th>
                  <th className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60 hidden md:table-cell" style={{ fontSize: 12, fontWeight: 600 }}>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.point_log_id} className="border-b border-[var(--cafe-bg)] last:border-0">
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                      {new Date(log.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={log.change_type} />
                    </td>
                    <td className="font-body text-right px-4 py-3" style={{ fontSize: 14, fontWeight: 600, color: log.points_changed > 0 ? "#16a34a" : "var(--cafe-red)" }}>
                      {log.points_changed > 0 ? "+" : ""}{log.points_changed}
                    </td>
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/60 hidden md:table-cell" style={{ fontSize: 13 }}>
                      {log.reason || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    EARN: { bg: "#dcfce7", text: "#16a34a", label: "Tích" },
    REDEEM: { bg: "#fef2f2", text: "#dc2626", label: "Đổi" },
    ADJUST: { bg: "#fef9c3", text: "#ca8a04", label: "Điều chỉnh" },
  };
  const c = config[type] || { bg: "#f3f4f6", text: "#6b7280", label: type };
  return (
    <span className="font-body inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.text, fontSize: 11, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}
