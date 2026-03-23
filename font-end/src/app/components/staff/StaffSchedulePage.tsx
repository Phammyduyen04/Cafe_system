import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { staffService, type Shift, type Assignment, type Employee } from "../../../services/staff.service";

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDateVN(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_LABELS[d.getDay()]}, ${dateStr}`;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PLANNED:   { bg: "#dbeafe", text: "#2563eb" },
  ACTIVE:    { bg: "#dcfce7", text: "#16a34a" },
  COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", text: "#dc2626" },
};

export default function StaffSchedulePage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [myLoading, setMyLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [detailShift, setDetailShift] = useState<(Shift & { assignments?: Assignment[] }) | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadEmployee();
  }, [isLoggedIn]);

  useEffect(() => {
    loadShifts();
  }, [filterDate, filterStatus]);

  useEffect(() => {
    if (employee && tab === "mine") loadMyShifts();
  }, [employee, tab, filterDate, filterStatus]);

  const loadEmployee = async () => {
    try {
      const emp = await staffService.getEmployeeByAccountId(user!.accountId);
      setEmployee(emp);
    } catch {}
  };

  const loadShifts = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const res = await staffService.getShifts(params);
      const list = Array.isArray(res) ? res : (res as any)?.shifts ?? (res as any)?.data ?? [];
      setShifts(list);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadMyShifts = async () => {
    if (!employee) return;
    try {
      setMyLoading(true);
      const params: any = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus) params.status = filterStatus;
      const res = await staffService.getEmployeeShifts(employee.employeeId, params);
      const list = (res as any)?.shifts ?? (res as any)?.data ?? [];
      setMyShifts(list);
    } catch {} finally {
      setMyLoading(false);
    }
  };

  const openDetail = async (shift: Shift) => {
    try {
      const detail = await staffService.getShiftById(shift.shiftId);
      setDetailShift(detail);
    } catch {}
  };

  const activeList = tab === "all" ? shifts : myShifts;
  const activeLoading = tab === "all" ? loading : myLoading;

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>
            Lịch làm việc
          </h1>
          <Link
            to="/staff/availability"
            className="font-body px-4 py-2 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            Cập nhật lịch rảnh
          </Link>
        </div>

        {employee && (
          <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 14 }}>
            Xin chào <strong>{employee.fullName}</strong> — {employee.position}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-[var(--cafe-border)] rounded-xl p-1 w-fit">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="font-body px-5 py-2 rounded-lg transition-colors"
              style={{
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: tab === t ? "var(--cafe-primary)" : "transparent",
                color: tab === t ? "#fff" : "var(--cafe-primary)",
              }}
            >
              {t === "all" ? "Tất cả ca" : "Ca của tôi"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
            style={{ fontSize: 13 }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
            style={{ fontSize: 13 }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PLANNED">PLANNED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          {(filterDate || filterStatus) && (
            <button
              onClick={() => { setFilterDate(""); setFilterStatus(""); }}
              className="font-body px-3 py-2 text-[var(--cafe-red)] hover:underline"
              style={{ fontSize: 13 }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Shift list */}
        {activeLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
            <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>
              {tab === "mine" ? "Bạn chưa được phân công vào ca nào" : "Không có ca nào"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeList.map((shift) => {
              const sc = STATUS_COLORS[shift.status] || STATUS_COLORS.PLANNED;
              return (
                <button
                  key={shift.shiftId}
                  onClick={() => openDetail(shift)}
                  className="bg-white rounded-2xl p-5 border border-[var(--cafe-border)] hover:border-[var(--cafe-gold)] transition-colors text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 600 }}>
                        {shift.shiftName}
                      </h3>
                      {tab === "mine" && (
                        <span className="font-body px-2 py-0.5 rounded-full text-white" style={{ fontSize: 10, fontWeight: 600, backgroundColor: "var(--cafe-gold)" }}>
                          Của bạn
                        </span>
                      )}
                    </div>
                    <span className="font-body px-2.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600 }}>
                      {shift.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <span className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>
                      🕐 {shift.startTime} — {shift.endTime}
                    </span>
                    <span className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>
                      📅 {formatDateVN(shift.workingDate)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        {detailShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailShift(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
                {detailShift.shiftName}
              </h2>
              <div className="space-y-2 mb-4">
                <InfoLine label="Thời gian" value={`${detailShift.startTime} — ${detailShift.endTime}`} />
                <InfoLine label="Ngày" value={formatDateVN(detailShift.workingDate)} />
                <InfoLine label="Trạng thái" value={detailShift.status} />
              </div>
              <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>
                Nhân viên trong ca ({detailShift.assignments?.length ?? 0})
              </h3>
              {(!detailShift.assignments || detailShift.assignments.length === 0) ? (
                <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>Chưa có nhân viên nào được gán</p>
              ) : (
                <ul className="space-y-1">
                  {detailShift.assignments.map((a, i) => {
                    const isMe = a.employeeId === employee?.employeeId;
                    return (
                      <li
                        key={a.employeeId}
                        className="font-body px-3 py-2 rounded-lg flex items-center gap-2"
                        style={{
                          fontSize: 13,
                          backgroundColor: isMe ? "#fef9ec" : "var(--cafe-bg)",
                          fontWeight: isMe ? 600 : 400,
                        }}
                      >
                        <span style={{ color: isMe ? "var(--cafe-gold)" : "var(--cafe-primary)" }}>
                          {isMe ? "★ Bạn" : `Nhân viên ${i + 1}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <button
                onClick={() => setDetailShift(null)}
                className="font-body w-full mt-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90"
                style={{ fontSize: 14, fontWeight: 500 }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-body text-[var(--cafe-primary)]/50 w-24 shrink-0" style={{ fontSize: 13 }}>{label}:</span>
      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
