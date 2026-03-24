import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  staffService,
  type Shift,
  type Employee,
} from "../../../services/staff.service";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PLANNED: { bg: "#dbeafe", text: "#2563eb" },
  ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
  COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", text: "#dc2626" },
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Đã lên lịch",
  ACTIVE: "Đang làm",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const DAY_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatDateVN(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_VN[d.getDay()]}, ${dateStr}`;
}

export default function StaffShiftsPage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user?.accountId) {
      loadEmployee(user.accountId);
    }
  }, [user?.accountId]);

  useEffect(() => {
    if (employee) {
      loadShifts(employee.employeeId);
    }
  }, [employee, page, filterDate, filterStatus]);

  const loadEmployee = async (accountId: string) => {
    try {
      const emp = await staffService.getEmployeeByAccountId(accountId);
      setEmployee(emp);
    } catch {
      setError("Không tìm thấy thông tin nhân viên của bạn.");
      setLoading(false);
    }
  };

  const loadShifts = async (employeeId: string) => {
    try {
      setLoading(true);
      const res = (await staffService.getEmployeeShifts(employeeId, {
        page,
        limit: 10,
      })) as any;
      let list: Shift[] = Array.isArray(res)
        ? res
        : res?.data ?? res?.shifts ?? [];

      if (filterDate) {
        list = list.filter((s) => s.workingDate === filterDate);
      }
      if (filterStatus) {
        list = list.filter((s) => s.status === filterStatus);
      }

      setShifts(list);
      setTotalPages(res?.pagination?.totalPages ?? 1);
    } catch {
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const todayShifts = shifts.filter((s) => s.workingDate === today);
  const upcomingShifts = shifts.filter(
    (s) => s.workingDate > today && s.status !== "CANCELLED"
  );

  return (
    <div>
      <h1
        className="font-heading text-[var(--cafe-primary)] mb-2"
        style={{ fontSize: 28, fontWeight: 700 }}
      >
        Ca làm của tôi
      </h1>
      {employee && (
        <p
          className="font-body text-[var(--cafe-primary)]/60 mb-6"
          style={{ fontSize: 14 }}
        >
          {employee.fullName} · {employee.position}
        </p>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-body text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-[var(--cafe-border)]">
            <p
              className="font-body text-[var(--cafe-primary)]/60 mb-1"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              Ca hôm nay
            </p>
            <p
              className="font-heading text-[var(--cafe-primary)]"
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {todayShifts.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[var(--cafe-border)]">
            <p
              className="font-body text-[var(--cafe-primary)]/60 mb-1"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              Sắp tới
            </p>
            <p
              className="font-heading text-[var(--cafe-primary)]"
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {upcomingShifts.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[var(--cafe-border)]">
            <p
              className="font-body text-[var(--cafe-primary)]/60 mb-1"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              Tổng ca
            </p>
            <p
              className="font-heading text-[var(--cafe-primary)]"
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {shifts.length}
            </p>
          </div>
        </div>
      )}

      {/* Today highlight */}
      {!loading && todayShifts.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border-2 border-[var(--cafe-gold)] bg-[var(--cafe-gold)]/5">
          <p
            className="font-body text-[var(--cafe-gold)] mb-2"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}
          >
            CA HÔM NAY
          </p>
          <div className="flex flex-wrap gap-3">
            {todayShifts.map((s) => {
              const sc = STATUS_COLORS[s.status] || STATUS_COLORS.PLANNED;
              return (
                <div
                  key={s.shiftId}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[var(--cafe-border)]"
                >
                  <div>
                    <p
                      className="font-body text-[var(--cafe-primary)]"
                      style={{ fontSize: 14, fontWeight: 600 }}
                    >
                      {s.shiftName}
                    </p>
                    <p
                      className="font-body text-[var(--cafe-primary)]/60"
                      style={{ fontSize: 12 }}
                    >
                      {s.startTime} — {s.endTime}
                    </p>
                  </div>
                  <span
                    className="font-body px-2.5 py-0.5 rounded-full"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: sc.bg,
                      color: sc.text,
                    }}
                  >
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setPage(1);
          }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
          style={{ fontSize: 13 }}
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
          style={{ fontSize: 13 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PLANNED">Đã lên lịch</option>
          <option value="ACTIVE">Đang làm</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
        {(filterDate || filterStatus) && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterStatus("");
            }}
            className="font-body px-3 py-2 text-[var(--cafe-red)] hover:underline"
            style={{ fontSize: 13 }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[var(--cafe-border)] text-center">
          <p
            className="font-body text-[var(--cafe-primary)]/50"
            style={{ fontSize: 14 }}
          >
            {error
              ? "Không thể tải ca làm."
              : "Không có ca làm nào trong khoảng thời gian này."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên ca", "Giờ làm", "Ngày", "Trạng thái"].map((h) => (
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
              {shifts.map((shift) => {
                const sc = STATUS_COLORS[shift.status] || STATUS_COLORS.PLANNED;
                const isToday = shift.workingDate === today;
                return (
                  <tr
                    key={shift.shiftId}
                    className="border-b border-[var(--cafe-bg)] last:border-0"
                    style={
                      isToday ? { backgroundColor: "#fffbeb" } : undefined
                    }
                  >
                    <td
                      className="font-body px-4 py-3 text-[var(--cafe-primary)]"
                      style={{ fontSize: 13, fontWeight: 500 }}
                    >
                      {shift.shiftName}
                      {isToday && (
                        <span
                          className="ml-2 font-body px-1.5 py-0.5 rounded text-white"
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            backgroundColor: "var(--cafe-gold)",
                          }}
                        >
                          HÔM NAY
                        </span>
                      )}
                    </td>
                    <td
                      className="font-body px-4 py-3 text-[var(--cafe-primary)]/70"
                      style={{ fontSize: 13 }}
                    >
                      {shift.startTime} — {shift.endTime}
                    </td>
                    <td
                      className="font-body px-4 py-3 text-[var(--cafe-primary)]/70"
                      style={{ fontSize: 13 }}
                    >
                      {formatDateVN(shift.workingDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-body px-2.5 py-0.5 rounded-full"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: sc.bg,
                          color: sc.text,
                        }}
                      >
                        {STATUS_LABELS[shift.status] || shift.status}
                      </span>
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
          <span
            className="font-body text-[var(--cafe-primary)]"
            style={{ fontSize: 13 }}
          >
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
    </div>
  );
}
