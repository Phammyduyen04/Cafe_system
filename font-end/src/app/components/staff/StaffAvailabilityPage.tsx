import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { staffService, type Employee } from "../../../services/staff.service";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Thứ 2", TUE: "Thứ 3", WED: "Thứ 4",
  THU: "Thứ 5", FRI: "Thứ 6", SAT: "Thứ 7", SUN: "CN",
};
const DAY_SHORT: Record<string, string> = {
  MON: "T2", TUE: "T3", WED: "T4",
  THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN",
};

export default function StaffAvailabilityPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeRanges, setTimeRanges] = useState<{ start: string; end: string }[]>([]);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const emp = await staffService.getEmployeeByAccountId(user!.accountId);
      setEmployee(emp);
      const avail = await staffService.getAvailability(emp.employeeId);
      if (avail) {
        setSelectedDays(avail.availableDays || []);
        setTimeRanges(avail.availableTimeRanges || []);
      }
    } catch {} finally { setLoading(false); }
  };

  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const addTimeRange = () =>
    setTimeRanges((prev) => [...prev, { start: "08:00", end: "17:00" }]);

  const removeTimeRange = (i: number) =>
    setTimeRanges((prev) => prev.filter((_, idx) => idx !== i));

  const updateTimeRange = (i: number, field: "start" | "end", value: string) =>
    setTimeRanges((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSave = async () => {
    if (!employee) return;
    try {
      setSaving(true);
      setError("");
      await staffService.updateAvailability(employee.employeeId, {
        availableDays: selectedDays,
        availableTimeRanges: timeRanges,
      });
      setSuccessMsg("Cập nhật lịch rảnh thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Lỗi khi cập nhật");
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (employee?.employeeType === "FULL_TIME") {
    return (
      <div>
        <h1 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 28, fontWeight: 700 }}>Lịch rảnh</h1>
        <div className="bg-white rounded-2xl p-10 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 15, fontWeight: 600 }}>Không cần đăng ký lịch rảnh</p>
          <p className="font-body text-[var(--cafe-primary)]/50 mt-2" style={{ fontSize: 13 }}>
            Nhân viên FULL_TIME làm việc theo lịch cố định, manager sẽ phân ca trực tiếp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Lịch rảnh</h1>
          {employee && (
            <p className="font-body text-[var(--cafe-primary)]/60 mt-0.5" style={{ fontSize: 13 }}>
              {employee.fullName} · PART_TIME · Click vào ngày để bật/tắt
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-body px-5 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ fontSize: 13, fontWeight: 600 }}
        >
          {saving ? "Đang lưu..." : "Lưu lịch rảnh"}
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 font-body text-sm">{error}</div>
      )}

      {/* ── 7-column calendar grid ── */}
      <div className="grid min-w-[600px] mb-6" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {DAYS.map((day) => {
          const active = selectedDays.includes(day);
          return (
            <div key={day} className="flex flex-col" style={{ minHeight: 220 }}>
              {/* Day header — click to toggle */}
              <button
                onClick={() => toggleDay(day)}
                className="w-full text-center py-3 mb-2 rounded-xl font-body transition-all hover:opacity-90"
                style={{
                  fontSize: 12, fontWeight: 700,
                  backgroundColor: active ? "var(--cafe-primary)" : "var(--cafe-bg)",
                  color: active ? "#fff" : "var(--cafe-primary)",
                  border: active ? "none" : "2px dashed var(--cafe-border)",
                }}
              >
                <div style={{ fontSize: 10, opacity: active ? 0.75 : 0.5 }}>{DAY_LABELS[day]}</div>
                <div style={{ fontSize: 18, marginTop: 2 }}>{DAY_SHORT[day]}</div>
                <div style={{ fontSize: 9, marginTop: 3, opacity: 0.8 }}>
                  {active ? "✓ Rảnh" : "Bấm để chọn"}
                </div>
              </button>

              {/* Time range chips */}
              <div className="flex flex-col gap-1.5 flex-1">
                {active ? (
                  timeRanges.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed"
                      style={{ borderColor: "#86efac", backgroundColor: "#f0fdf4", minHeight: 60 }}>
                      <span className="font-body text-green-500" style={{ fontSize: 10, textAlign: "center", padding: "0 8px" }}>
                        Chưa có khung giờ
                      </span>
                    </div>
                  ) : (
                    timeRanges.map((r, i) => (
                      <div key={i} className="rounded-xl px-2 py-1.5 text-center"
                        style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}>
                        <div className="font-body text-green-700" style={{ fontSize: 10, fontWeight: 700 }}>
                          {r.start}–{r.end}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-[var(--cafe-border)]"
                    style={{ minHeight: 60 }}>
                    <span className="font-body text-[var(--cafe-primary)]/20" style={{ fontSize: 10 }}>Không rảnh</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Time ranges editor ── */}
      <div className="bg-white rounded-2xl border border-[var(--cafe-border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 16, fontWeight: 600 }}>Khung giờ</h2>
            <p className="font-body text-[var(--cafe-primary)]/50 mt-0.5" style={{ fontSize: 12 }}>
              Áp dụng chung cho tất cả ngày đã chọn ở trên
            </p>
          </div>
          <button
            onClick={addTimeRange}
            className="font-body flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--cafe-border)] hover:border-[var(--cafe-gold)] hover:text-[var(--cafe-gold)] text-[var(--cafe-primary)] transition-colors"
            style={{ fontSize: 12, fontWeight: 500 }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Thêm khung giờ
          </button>
        </div>

        {timeRanges.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-[var(--cafe-border)] rounded-xl">
            <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>
              Chưa có khung giờ — bấm "+ Thêm khung giờ" để thêm
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeRanges.map((range, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--cafe-border)] bg-[var(--cafe-bg)]">
                {/* Index badge */}
                <span className="font-body shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--cafe-primary)] text-white"
                  style={{ fontSize: 10, fontWeight: 700 }}>
                  {i + 1}
                </span>

                <input
                  type="time"
                  value={range.start}
                  onChange={(e) => updateTimeRange(i, "start", e.target.value)}
                  className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 13 }}
                />
                <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 16 }}>—</span>
                <input
                  type="time"
                  value={range.end}
                  onChange={(e) => updateTimeRange(i, "end", e.target.value)}
                  className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 13 }}
                />

                {/* Duration label */}
                {(() => {
                  const [sh, sm] = range.start.split(":").map(Number);
                  const [eh, em] = range.end.split(":").map(Number);
                  const mins = (eh * 60 + em) - (sh * 60 + sm);
                  if (mins <= 0) return null;
                  const h = Math.floor(mins / 60), m = mins % 60;
                  return (
                    <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 11 }}>
                      {h > 0 ? `${h}h` : ""}{m > 0 ? `${m}p` : ""}
                    </span>
                  );
                })()}

                <button
                  onClick={() => removeTimeRange(i)}
                  className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {(selectedDays.length > 0 || timeRanges.length > 0) && (
        <div className="mt-4 px-4 py-3 bg-[var(--cafe-bg)] rounded-xl border border-[var(--cafe-border)]">
          <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 600 }}>
            Tóm tắt lịch rảnh:
          </p>
          <p className="font-body text-[var(--cafe-primary)]/70 mt-1" style={{ fontSize: 12 }}>
            {selectedDays.length === 0
              ? "Chưa chọn ngày nào"
              : `${selectedDays.map(d => DAY_SHORT[d]).join(", ")} — ${
                  timeRanges.length === 0
                    ? "chưa có khung giờ"
                    : timeRanges.map(r => `${r.start}–${r.end}`).join(", ")
                }`
            }
          </p>
        </div>
      )}
    </div>
  );
}
