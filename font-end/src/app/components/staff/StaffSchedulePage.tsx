import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { staffService, type Shift, type Assignment, type Employee } from "../../../services/staff.service";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 → 22:00
const CELL_H = 80;

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
};

const timeToY = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h + m / 60 - 6) * CELL_H;
};

const DAY_SHORT: Record<number, string> = { 0: "CN", 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7" };

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PLANNED:   { bg: "#dbeafe", text: "#2563eb" },
  ACTIVE:    { bg: "#dcfce7", text: "#16a34a" },
  COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", text: "#dc2626" },
};

const DAY_LABELS_VN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
function formatDateVN(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_LABELS_VN[d.getDay()]}, ${dateStr}`;
}

export default function StaffSchedulePage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedShift, setSelectedShift] = useState<(Shift & { assignments?: Assignment[] }) | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const emp = await staffService.getEmployeeByAccountId(user!.accountId);
      setEmployee(emp);
      const [res, myRes] = await Promise.all([
        staffService.getShifts({ limit: 200 }),
        staffService.getEmployeeShifts(emp.employeeId, {}),
      ]);
      const allList = Array.isArray(res) ? res : (res as any)?.data ?? (res as any)?.shifts ?? [];
      const myList = (myRes as any)?.shifts ?? (myRes as any)?.data ?? [];
      setAllShifts(allList);
      setMyShifts(Array.isArray(myList) ? myList : []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleShiftClick = async (shift: Shift, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const detail = await staffService.getShiftById(shift.shiftId);
      setSelectedShift(detail as Shift & { assignments?: Assignment[] });
      setPopoverPos({ x: e.clientX, y: e.clientY });
    } catch {
      setSelectedShift(shift);
      setPopoverPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Week helpers
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const toDateStr = (d: Date) => d.toISOString().split("T")[0];
  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date());

  const myShiftIds = new Set(myShifts.map((s) => s.shiftId));
  const activeList = tab === "all" ? allShifts : myShifts;

  const visibleShifts = activeList.filter((s) =>
    weekDates.some((d) => toDateStr(d) === s.workingDate) &&
    (!filterStatus || s.status === filterStatus)
  );

  const shiftsForDate = (d: Date) => visibleShifts.filter((s) => s.workingDate === toDateStr(d));

  const formatWeekRange = () =>
    `${String(weekDates[0].getDate()).padStart(2, "0")}/${String(weekDates[0].getMonth() + 1).padStart(2, "0")} — ` +
    `${String(weekDates[6].getDate()).padStart(2, "0")}/${String(weekDates[6].getMonth() + 1).padStart(2, "0")}/${weekDates[6].getFullYear()}`;

  const prevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const nextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--cafe-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)] pt-24">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Lịch làm việc</h1>
            {employee && (
              <p className="font-body text-[var(--cafe-primary)] mt-1" style={{ fontSize: 13, opacity: 0.6 }}>
                Xin chào <strong>{employee.fullName}</strong> — {employee.position}
              </p>
            )}
          </div>
          <Link
            to="/staff/availability"
            className="font-body px-4 py-2 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            Cập nhật lịch rảnh
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white border border-[var(--cafe-border)] rounded-xl p-1 w-fit">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="font-body px-5 py-2 rounded-lg transition-colors"
              style={{
                fontSize: 13, fontWeight: 600,
                backgroundColor: tab === t ? "var(--cafe-primary)" : "transparent",
                color: tab === t ? "#fff" : "var(--cafe-primary)",
              }}
            >
              {t === "all" ? "Tất cả ca" : "Ca của tôi"}
            </button>
          ))}
        </div>

        {/* Week nav + filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="font-body w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] bg-white hover:bg-[var(--cafe-accent)] text-[var(--cafe-primary)]" style={{ fontSize: 18 }}>‹</button>
            <span className="font-body text-[var(--cafe-primary)] px-3 py-1.5 bg-white border border-[var(--cafe-border)] rounded-lg" style={{ fontSize: 13, fontWeight: 500, minWidth: 170, textAlign: "center" }}>
              {formatWeekRange()}
            </span>
            <button onClick={nextWeek} className="font-body w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] bg-white hover:bg-[var(--cafe-accent)] text-[var(--cafe-primary)]" style={{ fontSize: 18 }}>›</button>
          </div>
          <button onClick={() => setCurrentWeekStart(getWeekStart(new Date()))} className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg bg-white hover:bg-[var(--cafe-accent)] text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 500 }}>
            Hôm nay
          </button>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)] text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
            <option value="">Tất cả trạng thái</option>
            <option value="PLANNED">PLANNED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden">
          {/* Day header */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", borderBottom: "1px solid var(--cafe-border)" }}>
            <div />
            {weekDates.map((d, i) => (
              <div key={i} className="font-body text-center py-3" style={{ borderLeft: "1px solid var(--cafe-border)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday(d) ? "var(--cafe-gold)" : "var(--cafe-primary)", opacity: isToday(d) ? 1 : 0.5 }}>
                  {DAY_SHORT[d.getDay()]}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 700, marginTop: 2,
                  width: 34, height: 34,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isToday(d) ? "var(--cafe-gold)" : "transparent",
                  color: isToday(d) ? "#fff" : "var(--cafe-primary)",
                  fontFamily: "inherit",
                }}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable grid */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 360px)" }}>
            {/* Background grid */}
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)" }}>
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="font-body text-[var(--cafe-primary)] select-none"
                    style={{ fontSize: 10, height: CELL_H, lineHeight: `${CELL_H}px`, textAlign: "right", paddingRight: 8, opacity: 0.35, borderTop: "1px solid var(--cafe-border)" }}>
                    {hour}:00
                  </div>
                  {weekDates.map((d, di) => (
                    <div key={`${di}-${hour}`} style={{
                      height: CELL_H,
                      borderTop: "1px solid var(--cafe-border)",
                      borderLeft: "1px solid var(--cafe-border)",
                      backgroundColor: isToday(d) ? "rgba(196,163,90,0.06)" : "transparent",
                    }} />
                  ))}
                </React.Fragment>
              ))}
            </div>

            {/* Shift blocks overlay */}
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", marginTop: `-${HOURS.length * CELL_H}px`, pointerEvents: "none" }}>
              <div />
              {weekDates.map((d, di) => (
                <div key={di} style={{ position: "relative", height: HOURS.length * CELL_H, pointerEvents: "auto" }}>
                  {shiftsForDate(d).map((shift) => {
                    const sc = STATUS_COLORS[shift.status] || STATUS_COLORS.PLANNED;
                    const top = timeToY(shift.startTime);
                    const height = Math.max(timeToY(shift.endTime) - top, 24);
                    const isMyShift = myShiftIds.has(shift.shiftId);
                    return (
                      <div
                        key={shift.shiftId}
                        onClick={(e) => handleShiftClick(shift, e)}
                        style={{
                          position: "absolute", top, height, left: 4, right: 4,
                          borderRadius: 8,
                          backgroundColor: sc.bg, color: sc.text,
                          border: isMyShift ? `2px solid ${sc.text}` : `1.5px solid ${sc.text}44`,
                          cursor: "pointer", padding: "6px 10px", overflow: "hidden", zIndex: 1,
                        }}
                      >
                        <p className="font-body" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {shift.shiftName}
                        </p>
                        <p className="font-body" style={{ fontSize: 12, opacity: 0.8 }}>{shift.startTime}–{shift.endTime}</p>
                        {isMyShift && (
                          <p className="font-body" style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-gold)" }}>★ Của bạn</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shift detail popover */}
        {selectedShift && popoverPos && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setSelectedShift(null)} />
            <div
              className="fixed z-40 bg-white rounded-xl border border-[var(--cafe-border)]"
              style={{
                width: 224,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                top: Math.min(popoverPos.y + 8, window.innerHeight - 220),
                left: Math.min(popoverPos.x + 8, window.innerWidth - 240),
                padding: 16,
              }}
            >
              <button onClick={() => setSelectedShift(null)} className="absolute top-2 right-3 font-body text-[var(--cafe-primary)] hover:opacity-80" style={{ fontSize: 18, lineHeight: 1, opacity: 0.4 }}>×</button>

              <p className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 600, paddingRight: 20 }}>{selectedShift.shiftName}</p>
              <p className="font-body text-[var(--cafe-primary)] mt-1" style={{ fontSize: 11, opacity: 0.6 }}>{selectedShift.startTime} – {selectedShift.endTime}</p>
              <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 11, opacity: 0.6 }}>{formatDateVN(selectedShift.workingDate)}</p>

              {(() => {
                const sc = STATUS_COLORS[selectedShift.status] || STATUS_COLORS.PLANNED;
                return (
                  <span className="font-body inline-block mt-1.5 px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, backgroundColor: sc.bg, color: sc.text }}>
                    {selectedShift.status}
                  </span>
                );
              })()}

              {selectedShift.assignments && selectedShift.assignments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--cafe-border)]">
                  <p className="font-body text-[var(--cafe-primary)] mb-1.5" style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>
                    Nhân viên ({selectedShift.assignments.length})
                  </p>
                  {selectedShift.assignments.map((a, i) => {
                    const isMe = a.employeeId === employee?.employeeId;
                    return (
                      <p key={a.employeeId} className="font-body" style={{
                        fontSize: 12, fontWeight: isMe ? 600 : 400,
                        color: isMe ? "var(--cafe-gold)" : "var(--cafe-primary)",
                        opacity: isMe ? 1 : 0.65,
                      }}>
                        {isMe ? "★ Bạn" : `Nhân viên ${i + 1}`}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
