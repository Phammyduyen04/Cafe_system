import { useEffect, useRef, useState } from "react";
import { staffService, type Shift, type Employee, type Assignment } from "../../../services/staff.service";

// ── helpers ──────────────────────────────────────────────────────────────────
const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Thứ 2", TUE: "Thứ 3", WED: "Thứ 4", THU: "Thứ 5",
  FRI: "Thứ 6", SAT: "Thứ 7", SUN: "Chủ nhật",
};
const JS_DAY_TO_KEY: Record<number, string> = {
  0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT",
};

function getWeekDates(anchor: Date): Date[] {
  const d = new Date(anchor);
  // Monday = 0 offset
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    return dt;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDateShort(d: Date) {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

function formatDateShortFull(d: Date) {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

function MiniCalendar({ selectedDate, onSelect, onClose }: {
  selectedDate: Date; onSelect: (d: Date) => void; onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };
  const todayStr = toDateStr(new Date());
  const selectedStr = toDateStr(selectedDate);
  return (
    <div className="absolute z-50 bg-white rounded-2xl border border-[var(--cafe-border)] p-3 shadow-xl"
      style={{ width: 260, top: "calc(100% + 6px)", left: 0 }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="font-body w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 16 }}>‹</button>
        <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="font-body w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 16 }}>›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
          <div key={d} className="font-body text-center text-[var(--cafe-primary)]/40" style={{ fontSize: 10, fontWeight: 600, padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startOffset }).map((_,i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_,i) => {
          const day = i+1;
          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = dateStr === todayStr;
          const isSel = dateStr === selectedStr;
          return (
            <button key={day} onClick={() => { onSelect(new Date(viewYear, viewMonth, day)); onClose(); }}
              className="font-body w-full aspect-square flex items-center justify-center rounded-lg transition-colors"
              style={{ fontSize: 12, fontWeight: isToday||isSel ? 700 : 400,
                backgroundColor: isSel ? "var(--cafe-primary)" : isToday ? "var(--cafe-gold)" : "transparent",
                color: isSel||isToday ? "#fff" : "var(--cafe-primary)" }}>
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

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  PLANNED:   { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8" },
  ACTIVE:    { bg: "#f0fdf4", border: "#86efac", text: "#15803d" },
  COMPLETED: { bg: "#f3f4f6", border: "#d1d5db", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626" },
};

// ── types ─────────────────────────────────────────────────────────────────────
interface ShiftWithAssignments extends Shift {
  assignedEmployees: Employee[];
}

// ── component ─────────────────────────────────────────────────────────────────
export default function ManagerSchedulePage() {
  const [anchor, setAnchor] = useState(() => new Date());
  const weekDates = getWeekDates(anchor);

  const [shifts, setShifts] = useState<ShiftWithAssignments[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // date picker
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // drag state
  const draggingEmpId = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // shiftId being hovered

  // create shift dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState("");
  const [createName, setCreateName] = useState("");
  const [createStart, setCreateStart] = useState("08:00");
  const [createEnd, setCreateEnd] = useState("17:00");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // shift detail panel
  const [detailShift, setDetailShift] = useState<ShiftWithAssignments | null>(null);

  // cancel dialog
  const [cancelShift, setCancelShift] = useState<ShiftWithAssignments | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const weekStart = toDateStr(weekDates[0]);
  const weekEnd = toDateStr(weekDates[6]);

  useEffect(() => {
    loadAll();
  }, [weekStart]);

  const loadAll = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [shiftsRes, empRes] = await Promise.all([
        // fetch all shifts in week range - we'll filter client-side
        staffService.getShifts({ limit: 200 }),
        staffService.getEmployees({ limit: 200, status: "ACTIVE" }),
      ]);

      const allShifts: Shift[] = (shiftsRes as any)?.data ?? [];
      const weekShifts = allShifts.filter((s) => s.workingDate >= weekStart && s.workingDate <= weekEnd);

      const allEmps: Employee[] = (empRes as any)?.data ?? [];
      setEmployees(allEmps);

      // fetch assignments for each shift in week
      const withAssignments: ShiftWithAssignments[] = await Promise.all(
        weekShifts.map(async (shift) => {
          try {
            const asgn = await staffService.getAssignments(shift.shiftId);
            const asgnList: Assignment[] = Array.isArray(asgn) ? asgn : [];
            const assignedEmployees = asgnList
              .map((a) => allEmps.find((e) => e.employeeId === a.employeeId))
              .filter(Boolean) as Employee[];
            return { ...shift, assignedEmployees };
          } catch {
            return { ...shift, assignedEmployees: [] };
          }
        })
      );

      setShifts(withAssignments);
    } catch (e: any) {
      setErrorMsg(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ── drag-and-drop ──────────────────────────────────────────────────────────
  const onDragStart = (empId: string) => {
    draggingEmpId.current = empId;
  };

  const onDragOver = (e: React.DragEvent, shiftId: string) => {
    e.preventDefault();
    setDropTarget(shiftId);
  };

  const onDragLeave = () => {
    setDropTarget(null);
  };

  const onDrop = async (e: React.DragEvent, shift: ShiftWithAssignments) => {
    e.preventDefault();
    setDropTarget(null);
    const empId = draggingEmpId.current;
    if (!empId) return;
    if (shift.status === "CANCELLED" || shift.status === "COMPLETED") {
      setErrorMsg("Không thể gán vào ca đã hủy hoặc đã hoàn thành");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    if (shift.assignedEmployees.some((e) => e.employeeId === empId)) {
      setErrorMsg("Nhân viên đã được gán vào ca này");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    try {
      await staffService.assignEmployee(shift.shiftId, empId);
      showSuccess("Đã gán nhân viên!");
      loadAll();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi gán");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleRemoveAssignment = async (shiftId: string, empId: string) => {
    try {
      await staffService.removeAssignment(shiftId, empId);
      showSuccess("Đã gỡ nhân viên!");
      loadAll();
      // refresh detailShift
      if (detailShift?.shiftId === shiftId) {
        setDetailShift((prev) =>
          prev ? { ...prev, assignedEmployees: prev.assignedEmployees.filter((e) => e.employeeId !== empId) } : null
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi gỡ");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  // ── create shift ───────────────────────────────────────────────────────────
  const openCreate = (dateStr: string) => {
    setCreateDate(dateStr);
    setCreateName("");
    setCreateStart("08:00");
    setCreateEnd("17:00");
    setCreateError("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError("Nhập tên ca"); return; }
    if (!createDate) { setCreateError("Chọn ngày"); return; }
    try {
      setCreateSaving(true);
      setCreateError("");
      await staffService.createShift({
        shiftName: createName,
        startTime: createStart,
        endTime: createEnd,
        workingDate: createDate,
      });
      setCreateOpen(false);
      showSuccess("Tạo ca thành công!");
      loadAll();
    } catch (err: any) {
      setCreateError(err.message || "Lỗi khi tạo ca");
    } finally {
      setCreateSaving(false);
    }
  };

  // ── cancel shift ───────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelShift) return;
    if (!cancelReason.trim()) { setCancelError("Nhập lý do hủy ca"); return; }
    try {
      setCancelling(true);
      setCancelError("");
      await staffService.cancelShift(cancelShift.shiftId, cancelReason.trim());
      setCancelShift(null);
      setCancelReason("");
      showSuccess("Đã hủy ca!");
      loadAll();
    } catch (err: any) {
      setCancelError(err.message || "Lỗi khi hủy ca");
    } finally {
      setCancelling(false);
    }
  };

  // ── week navigation ────────────────────────────────────────────────────────
  const prevWeek = () => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setAnchor((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => setAnchor(new Date());

  // close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  const isToday = (d: Date) => toDateStr(d) === toDateStr(new Date());
  const shiftsForDate = (dateStr: string) =>
    shifts.filter((s) => s.workingDate === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const unassignedEmployees = employees.filter((e) =>
    !shifts.some((s) => s.assignedEmployees.some((ae) => ae.employeeId === e.employeeId))
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>
          Lịch ca làm
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="font-body p-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white" style={{ fontSize: 14 }}>‹</button>

          {/* Date picker */}
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setShowCalendar(v => !v)}
              className="font-body flex items-center gap-2 px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white hover:border-[var(--cafe-gold)] transition-colors"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-primary)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formatDateShortFull(weekDates[0])} — {formatDateShortFull(weekDates[6])}/{weekDates[6].getFullYear()}
            </button>
            {showCalendar && (
              <MiniCalendar
                selectedDate={anchor}
                onSelect={(d) => setAnchor(d)}
                onClose={() => setShowCalendar(false)}
              />
            )}
          </div>

          <button onClick={nextWeek} className="font-body p-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white" style={{ fontSize: 14 }}>›</button>
          <button onClick={goToday} className="font-body px-3 py-2 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white" style={{ fontSize: 13 }}>Hôm nay</button>
        </div>
      </div>

      {successMsg && <div className="mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>}
      {errorMsg && <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 font-body text-sm">{errorMsg}</div>}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* ── Calendar grid ── */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {weekDates.map((date, idx) => {
                const dateStr = toDateStr(date);
                const dayKey = DAY_KEYS[idx];
                const dayShifts = shiftsForDate(dateStr);
                const today = isToday(date);

                return (
                  <div key={dateStr} className="flex flex-col" style={{ minHeight: 400 }}>
                    {/* Day header */}
                    <div
                      className="text-center py-2 mb-2 rounded-xl font-body"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: today ? "var(--cafe-primary)" : "var(--cafe-bg)",
                        color: today ? "#fff" : "var(--cafe-primary)",
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{DAY_LABELS[dayKey]}</div>
                      <div style={{ fontSize: 16 }}>{date.getDate()}</div>
                    </div>

                    {/* Shift cards drop zone */}
                    <div className="flex flex-col gap-2 flex-1">
                      {dayShifts.map((shift) => {
                        const st = STATUS_STYLE[shift.status] || STATUS_STYLE.PLANNED;
                        const isDrop = dropTarget === shift.shiftId;
                        return (
                          <div
                            key={shift.shiftId}
                            onDragOver={(e) => onDragOver(e, shift.shiftId)}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, shift)}
                            onClick={() => setDetailShift(shift)}
                            className="rounded-xl border cursor-pointer transition-all"
                            style={{
                              backgroundColor: isDrop ? "#fef9c3" : st.bg,
                              borderColor: isDrop ? "#f59e0b" : st.border,
                              borderWidth: isDrop ? 2 : 1,
                              padding: "8px 10px",
                              boxShadow: isDrop ? "0 0 0 2px #fde68a" : undefined,
                            }}
                          >
                            <div className="font-body" style={{ fontSize: 11, fontWeight: 700, color: st.text }}>{shift.shiftName}</div>
                            <div className="font-body" style={{ fontSize: 10, color: st.text, opacity: 0.8 }}>{shift.startTime}–{shift.endTime}</div>
                            {/* Assigned employees */}
                            {shift.assignedEmployees.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {shift.assignedEmployees.map((emp) => (
                                  <span
                                    key={emp.employeeId}
                                    className="font-body px-1.5 py-0.5 rounded-md text-white"
                                    style={{ fontSize: 9, fontWeight: 600, backgroundColor: "var(--cafe-primary)", opacity: 0.85 }}
                                  >
                                    {emp.fullName.split(" ").slice(-1)[0]}
                                  </span>
                                ))}
                              </div>
                            )}
                            {isDrop && (
                              <div className="font-body mt-1" style={{ fontSize: 9, color: "#92400e", fontWeight: 600 }}>Thả để gán</div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add shift button */}
                      <button
                        onClick={() => openCreate(dateStr)}
                        className="font-body w-full py-2 rounded-xl border border-dashed hover:border-[var(--cafe-gold)] hover:text-[var(--cafe-gold)] transition-colors text-[var(--cafe-primary)]/30"
                        style={{ fontSize: 18, borderColor: "var(--cafe-border)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Employee panel ── */}
        <div
          className="shrink-0 bg-white rounded-2xl border border-[var(--cafe-border)] flex flex-col overflow-hidden"
          style={{ width: 200 }}
        >
          <div className="px-4 py-3 border-b border-[var(--cafe-border)]">
            <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>
              Nhân viên ({employees.length})
            </p>
            <p className="font-body text-[var(--cafe-primary)]/50 mt-0.5" style={{ fontSize: 10 }}>
              Kéo thả vào ca để gán
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1.5">
            {employees.map((emp) => {
              const assigned = shifts.some((s) => s.assignedEmployees.some((ae) => ae.employeeId === emp.employeeId));
              return (
                <div
                  key={emp.employeeId}
                  draggable
                  onDragStart={() => onDragStart(emp.employeeId)}
                  className="rounded-xl border cursor-grab active:cursor-grabbing px-3 py-2 select-none"
                  style={{
                    borderColor: assigned ? "#86efac" : "var(--cafe-border)",
                    backgroundColor: assigned ? "#f0fdf4" : "white",
                  }}
                >
                  <div className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 500 }}>
                    {emp.fullName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className="font-body px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: 9, fontWeight: 600,
                        backgroundColor: emp.employeeType === "FULL_TIME" ? "#dbeafe" : "#fef9c3",
                        color: emp.employeeType === "FULL_TIME" ? "#1d4ed8" : "#92400e",
                      }}
                    >
                      {emp.employeeType === "FULL_TIME" ? "FT" : "PT"}
                    </span>
                    <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 9 }}>{emp.position}</span>
                  </div>
                  {assigned && (
                    <div className="font-body mt-0.5" style={{ fontSize: 9, color: "#15803d", fontWeight: 600 }}>Đã xếp tuần này</div>
                  )}
                </div>
              );
            })}
            {employees.length === 0 && !loading && (
              <p className="font-body text-[var(--cafe-primary)]/30 text-center py-4" style={{ fontSize: 12 }}>Không có nhân viên</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Shift Dialog ── */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCreateOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>Tạo ca mới</h2>
            {createError && <p className="font-body text-red-500 mb-3 text-sm">{createError}</p>}
            <div className="space-y-3">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Tên ca</label>
                <input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="VD: Ca sáng" className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Ngày làm</label>
                <input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Bắt đầu</label>
                  <input type="time" value={createStart} onChange={(e) => setCreateStart(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Kết thúc</label>
                  <input type="time" value={createEnd} onChange={(e) => setCreateEnd(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateOpen(false)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleCreate} disabled={createSaving} className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {createSaving ? "Đang tạo..." : "Tạo ca"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift Detail Panel ── */}
      {detailShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30" onClick={() => setDetailShift(null)}>
          <div className="bg-white h-full w-full max-w-sm shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--cafe-border)]" style={{ backgroundColor: "var(--cafe-primary)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-white" style={{ fontSize: 20, fontWeight: 700 }}>{detailShift.shiftName}</h2>
                  <p className="font-body text-white/70 mt-1" style={{ fontSize: 13 }}>
                    {detailShift.workingDate} · {detailShift.startTime}–{detailShift.endTime}
                  </p>
                </div>
                <button onClick={() => setDetailShift(null)} className="text-white/60 hover:text-white" style={{ fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              {(() => {
                const st = STATUS_STYLE[detailShift.status] || STATUS_STYLE.PLANNED;
                return (
                  <span className="font-body inline-block mt-2 px-2.5 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: st.bg, color: st.text }}>
                    {detailShift.status}
                  </span>
                );
              })()}
              {detailShift.cancelReason && (
                <p className="font-body text-white/60 mt-2" style={{ fontSize: 11 }}>Lý do: {detailShift.cancelReason}</p>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="font-body text-[var(--cafe-primary)] mb-3" style={{ fontSize: 14, fontWeight: 600 }}>
                Nhân viên được gán ({detailShift.assignedEmployees.length})
              </h3>
              {detailShift.assignedEmployees.length === 0 ? (
                <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>Chưa có nhân viên nào</p>
              ) : (
                <div className="space-y-2">
                  {detailShift.assignedEmployees.map((emp) => (
                    <div key={emp.employeeId} className="flex items-center justify-between px-3 py-2.5 bg-[var(--cafe-bg)] rounded-xl">
                      <div>
                        <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{emp.fullName}</p>
                        <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>{emp.position} · {emp.employeeType}</p>
                      </div>
                      {detailShift.status !== "CANCELLED" && detailShift.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleRemoveAssignment(detailShift.shiftId, emp.employeeId)}
                          className="font-body text-red-400 hover:text-red-600"
                          style={{ fontSize: 12 }}
                        >
                          Gỡ
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add employees inline */}
              {detailShift.status !== "CANCELLED" && detailShift.status !== "COMPLETED" && (
                <>
                  <h3 className="font-body text-[var(--cafe-primary)] mt-5 mb-3" style={{ fontSize: 14, fontWeight: 600 }}>
                    Thêm nhân viên
                  </h3>
                  <div className="space-y-2">
                    {employees
                      .filter((e) => !detailShift.assignedEmployees.some((ae) => ae.employeeId === e.employeeId))
                      .map((emp) => (
                        <div key={emp.employeeId} className="flex items-center justify-between px-3 py-2 border border-[var(--cafe-border)] rounded-xl bg-white">
                          <div>
                            <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{emp.fullName}</p>
                            <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 10 }}>{emp.position} · {emp.employeeType === "FULL_TIME" ? "FT" : "PT"}</p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await staffService.assignEmployee(detailShift.shiftId, emp.employeeId);
                                showSuccess("Đã gán!");
                                // update local state
                                setDetailShift((prev) => prev ? { ...prev, assignedEmployees: [...prev.assignedEmployees, emp] } : null);
                                setShifts((prev) => prev.map((s) => s.shiftId === detailShift.shiftId ? { ...s, assignedEmployees: [...s.assignedEmployees, emp] } : s));
                              } catch (err: any) {
                                setErrorMsg(err.message || "Lỗi gán");
                                setTimeout(() => setErrorMsg(""), 4000);
                              }
                            }}
                            className="font-body px-3 py-1 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90"
                            style={{ fontSize: 12, fontWeight: 500 }}
                          >
                            Gán
                          </button>
                        </div>
                      ))}
                    {employees.filter((e) => !detailShift.assignedEmployees.some((ae) => ae.employeeId === e.employeeId)).length === 0 && (
                      <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>Tất cả nhân viên đã được gán</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {detailShift.status !== "CANCELLED" && detailShift.status !== "COMPLETED" && (
              <div className="px-6 py-4 border-t border-[var(--cafe-border)]">
                <button
                  onClick={() => { setCancelShift(detailShift); setCancelReason(""); setCancelError(""); setDetailShift(null); }}
                  className="font-body w-full py-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Hủy ca này
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cancel Shift Dialog ── */}
      {cancelShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setCancelShift(null); setCancelReason(""); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-red-600 mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Hủy ca</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-4" style={{ fontSize: 14 }}>
              <strong>{cancelShift.shiftName}</strong> — {cancelShift.workingDate}
            </p>
            {cancelError && <p className="font-body text-red-500 mb-3 text-sm">{cancelError}</p>}
            <div className="mb-4">
              <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Lý do <span className="text-red-500">*</span></label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do hủy ca..."
                className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] resize-none"
                style={{ fontSize: 14 }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCancelShift(null); setCancelReason(""); }} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Quay lại</button>
              <button onClick={handleCancel} disabled={cancelling} className="font-body flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {cancelling ? "Đang hủy..." : "Hủy ca"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
