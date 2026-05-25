import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { staffService, type Shift, type Employee } from "../../../services/staff.service";

// ── helpers ──────────────────────────────────────────────────────────────────
const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS_FULL: Record<string, string> = {
  MON: "Thứ 2", TUE: "Thứ 3", WED: "Thứ 4", THU: "Thứ 5",
  FRI: "Thứ 6", SAT: "Thứ 7", SUN: "Chủ nhật",
};
const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    return dt;
  });
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatDayHeader(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
function formatWeekRange(dates: Date[]) {
  const s = dates[0], e = dates[6];
  return `${formatDayHeader(s)} — ${formatDayHeader(e)}/${e.getFullYear()}`;
}

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  PLANNED:   { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  ACTIVE:    { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  COMPLETED: { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
};

// ── Mini Calendar component ───────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, onClose }: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const today = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);

  return (
    <div className="absolute z-50 bg-white rounded-2xl border border-[var(--cafe-border)] p-3 shadow-xl"
      style={{ width: 256, top: "calc(100% + 6px)", left: 0 }}>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="font-body w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--cafe-bg)] text-[var(--cafe-primary)]" style={{ fontSize: 16 }}>‹</button>
        <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="font-body w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--cafe-bg)] text-[var(--cafe-primary)]" style={{ fontSize: 16 }}>›</button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
          <div key={d} className="font-body text-center text-[var(--cafe-primary)]/40" style={{ fontSize: 10, fontWeight: 600, padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedStr;
          return (
            <button
              key={day}
              onClick={() => { onSelect(new Date(viewYear, viewMonth, day)); onClose(); }}
              className="font-body w-full aspect-square flex items-center justify-center rounded-lg transition-colors"
              style={{
                fontSize: 12,
                fontWeight: isToday || isSelected ? 700 : 400,
                backgroundColor: isSelected ? "var(--cafe-primary)" : isToday ? "var(--cafe-gold)" : "transparent",
                color: isSelected || isToday ? "#fff" : "var(--cafe-primary)",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
      <button onClick={onClose} className="font-body w-full mt-2 py-1.5 text-center text-[var(--cafe-primary)]/50 hover:text-[var(--cafe-primary)] border-t border-[var(--cafe-border)]" style={{ fontSize: 12 }}>
        Đóng
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StaffSchedulePage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anchor, setAnchor] = useState(() => new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const weekDates = getWeekDates(anchor);
  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[6]);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadEmployee();
  }, [isLoggedIn]);

  useEffect(() => {
    if (employee) loadShifts();
  }, [employee, weekStart]);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadEmployee = async () => {
    try {
      const emp = await staffService.getEmployeeByAccountId(user!.accountId);
      setEmployee(emp);
    } catch {
      setError("Không tìm thấy thông tin nhân viên. Vui lòng liên hệ quản lý.");
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      // Get employee's own shifts then filter by week
      const res = await staffService.getEmployeeShifts(employee.employeeId, { limit: 200 });
      const all: Shift[] = (res as any)?.data ?? (res as any)?.shifts ?? [];
      setShifts(all.filter(s => s.workingDate >= weekStart && s.workingDate <= weekEnd));
    } catch { setShifts([]); }
    finally { setLoading(false); }
  };

  const prevWeek = () => setAnchor(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setAnchor(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => setAnchor(new Date());

  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date());
  const shiftsForDate = (dateStr: string) =>
    shifts.filter(s => s.workingDate === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Lịch làm việc</h1>
          {employee && (
            <p className="font-body text-[var(--cafe-primary)]/60 mt-0.5" style={{ fontSize: 13 }}>
              {employee.fullName} · {employee.position} · {employee.employeeType}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-body text-sm">{error}</div>
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={prevWeek} className="font-body p-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white" style={{ fontSize: 16 }}>‹</button>

        {/* Date picker button */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setShowCalendar(v => !v)}
            className="font-body flex items-center gap-2 px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white hover:border-[var(--cafe-gold)] transition-colors"
            style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-primary)" }}
          >
            {/* Calendar icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formatWeekRange(weekDates)}
          </button>
          {showCalendar && (
            <MiniCalendar
              selectedDate={anchor}
              onSelect={(d) => setAnchor(d)}
              onClose={() => setShowCalendar(false)}
            />
          )}
        </div>

        <button onClick={nextWeek} className="font-body p-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white" style={{ fontSize: 16 }}>›</button>
        <button onClick={goToday} className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 500 }}>
          Hôm nay
        </button>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid min-w-[600px]" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {weekDates.map((date, idx) => {
            const dateStr = toDateStr(date);
            const dayKey = DAY_KEYS[idx];
            const dayShifts = shiftsForDate(dateStr);
            const today = isToday(date);

            return (
              <div key={dateStr} className="flex flex-col" style={{ minHeight: 300 }}>
                {/* Day header — shows full date */}
                <div
                  className="text-center py-2 mb-2 rounded-xl font-body"
                  style={{
                    fontSize: 12, fontWeight: 600,
                    backgroundColor: today ? "var(--cafe-primary)" : "var(--cafe-bg)",
                    color: today ? "#fff" : "var(--cafe-primary)",
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.75 }}>{DAY_LABELS_FULL[dayKey]}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>{formatDayHeader(date)}</div>
                  <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>{date.getFullYear()}</div>
                </div>

                {/* Shift cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {dayShifts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-[var(--cafe-border)]" style={{ minHeight: 60 }}>
                      <span className="font-body text-[var(--cafe-primary)]/20" style={{ fontSize: 11 }}>Không có ca</span>
                    </div>
                  ) : (
                    dayShifts.map((shift) => {
                      const st = STATUS_STYLE[shift.status] || STATUS_STYLE.PLANNED;
                      return (
                        <div
                          key={shift.shiftId}
                          onClick={() => setSelectedShift(selectedShift?.shiftId === shift.shiftId ? null : shift)}
                          className="rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                          style={{
                            backgroundColor: st.bg, borderColor: st.border,
                            borderWidth: 1, padding: "8px 10px",
                          }}
                        >
                          <div className="font-body" style={{ fontSize: 11, fontWeight: 700, color: st.text }}>{shift.shiftName}</div>
                          <div className="font-body" style={{ fontSize: 10, color: st.text, opacity: 0.8 }}>{shift.startTime}–{shift.endTime}</div>
                          <span className="font-body inline-block mt-1 px-1.5 py-0.5 rounded" style={{ fontSize: 9, fontWeight: 600, backgroundColor: st.border + "55", color: st.text }}>
                            {shift.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shift detail side panel */}
      {selectedShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30" onClick={() => setSelectedShift(null)}>
          <div className="bg-white h-full w-full max-w-xs shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-5 border-b border-[var(--cafe-border)]" style={{ backgroundColor: "var(--cafe-primary)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-white" style={{ fontSize: 18, fontWeight: 700 }}>{selectedShift.shiftName}</h2>
                  <p className="font-body text-white/70 mt-1" style={{ fontSize: 12 }}>
                    {selectedShift.workingDate} · {selectedShift.startTime}–{selectedShift.endTime}
                  </p>
                </div>
                <button onClick={() => setSelectedShift(null)} className="text-white/60 hover:text-white" style={{ fontSize: 22, lineHeight: 1 }}>×</button>
              </div>
              {(() => {
                const st = STATUS_STYLE[selectedShift.status] || STATUS_STYLE.PLANNED;
                return (
                  <span className="font-body inline-block mt-2 px-2.5 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: st.bg, color: st.text }}>
                    {selectedShift.status}
                  </span>
                );
              })()}
              {selectedShift.cancelReason && (
                <p className="font-body text-white/60 mt-1" style={{ fontSize: 11 }}>Lý do hủy: {selectedShift.cancelReason}</p>
              )}
            </div>
            <div className="flex-1 p-5">
              <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>
                Đây là ca làm của bạn. Hãy có mặt đúng giờ!
              </p>
              {selectedShift.status === "ACTIVE" && (
                <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="font-body text-green-700" style={{ fontSize: 13, fontWeight: 600 }}>Ca đang diễn ra</p>
                  <p className="font-body text-green-600" style={{ fontSize: 12 }}>Hôm nay {selectedShift.startTime} – {selectedShift.endTime}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
