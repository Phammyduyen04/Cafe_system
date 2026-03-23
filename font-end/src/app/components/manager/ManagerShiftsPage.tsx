import React, { useEffect, useState } from "react";
import { staffService, type Shift, type Assignment, type Employee, type Availability } from "../../../services/staff.service";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 → 22:00
const CELL_H = 56; // px per hour

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
const DAY_MAP: Record<number, string> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };
const DAY_LABELS: Record<string, string> = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" };

const statusColors: Record<string, { bg: string; text: string }> = {
  PLANNED: { bg: "#dbeafe", text: "#2563eb" },
  ACTIVE:  { bg: "#dcfce7", text: "#16a34a" },
  COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
  CANCELLED: { bg: "#fef2f2", text: "#dc2626" },
};

export default function ManagerShiftsPage() {
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("17:00");
  const [formDate, setFormDate] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deleteShift, setDeleteShift] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Assignment dialog
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [empAvailMap, setEmpAvailMap] = useState<Record<string, Availability>>({});

  useEffect(() => { loadShifts(); }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await staffService.getShifts({ limit: 200 });
      const data = res as any;
      setAllShifts(Array.isArray(data) ? data : data?.data ?? data?.shifts ?? []);
    } catch {} finally {
      setLoading(false);
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

  const visibleShifts = allShifts.filter((s) => {
    const inWeek = weekDates.some((d) => toDateStr(d) === s.workingDate);
    return inWeek && (!filterStatus || s.status === filterStatus);
  });

  const shiftsForDate = (d: Date) => visibleShifts.filter((s) => s.workingDate === toDateStr(d));

  const formatWeekRange = () =>
    `${String(weekDates[0].getDate()).padStart(2, "0")}/${String(weekDates[0].getMonth() + 1).padStart(2, "0")} — ` +
    `${String(weekDates[6].getDate()).padStart(2, "0")}/${String(weekDates[6].getMonth() + 1).padStart(2, "0")}/${weekDates[6].getFullYear()}`;

  const formatDateVN = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${days[d.getDay()]}, ${dateStr}`;
  };

  const prevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); };
  const nextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); };

  const openCreate = () => {
    setEditingId(null); setFormName(""); setFormStart("08:00"); setFormEnd("17:00");
    setFormDate(toDateStr(new Date())); setError(""); setFormOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingId(shift.shiftId); setFormName(shift.shiftName);
    setFormStart(shift.startTime); setFormEnd(shift.endTime);
    setFormDate(shift.workingDate); setError(""); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setError("Nhập tên ca"); return; }
    if (!formDate) { setError("Chọn ngày"); return; }
    try {
      setFormSaving(true); setError("");
      if (editingId) {
        await staffService.updateShift(editingId, { shiftName: formName, startTime: formStart, endTime: formEnd, workingDate: formDate });
        setSuccessMsg("Cập nhật ca thành công!");
      } else {
        await staffService.createShift({ shiftName: formName, startTime: formStart, endTime: formEnd, workingDate: formDate });
        setSuccessMsg("Tạo ca thành công!");
      }
      setFormOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadShifts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally { setFormSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteShift) return;
    try {
      setDeleting(true);
      await staffService.deleteShift(deleteShift.shiftId);
      setDeleteShift(null); setSuccessMsg("Đã hủy ca!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadShifts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi hủy ca");
    } finally { setDeleting(false); }
  };

  const openAssignment = async (shift: Shift) => {
    setAssignShift(shift);
    try {
      const [asgn, empRes] = await Promise.all([
        staffService.getAssignments(shift.shiftId),
        staffService.getEmployees({ limit: 100, status: "ACTIVE" }),
      ]);
      setAssignments(Array.isArray(asgn) ? asgn : []);
      const empData = empRes as any;
      const empList: Employee[] = Array.isArray(empData) ? empData : empData?.data ?? empData?.employees ?? [];
      setActiveEmployees(empList);
      const availResults = await Promise.allSettled(empList.map((e) => staffService.getAvailability(e.employeeId)));
      const availMap: Record<string, Availability> = {};
      empList.forEach((e, i) => {
        const r = availResults[i];
        if (r.status === "fulfilled" && r.value) availMap[e.employeeId] = r.value;
      });
      setEmpAvailMap(availMap);
    } catch { setAssignments([]); setActiveEmployees([]); }
  };

  const handleAssignDirect = async (empId: string) => {
    if (!assignShift || !empId) return;
    try {
      setAssigning(true);
      await staffService.assignEmployee(assignShift.shiftId, empId);
      const asgn = await staffService.getAssignments(assignShift.shiftId);
      setAssignments(Array.isArray(asgn) ? asgn : []);
    } catch (err: any) {
      alert(err.message || "Lỗi khi gán");
    } finally { setAssigning(false); }
  };

  const handleRemoveAssignment = async (empId: string) => {
    if (!assignShift) return;
    try {
      await staffService.removeAssignment(assignShift.shiftId, empId);
      const asgn = await staffService.getAssignments(assignShift.shiftId);
      setAssignments(Array.isArray(asgn) ? asgn : []);
    } catch (err: any) { alert(err.message || "Lỗi khi gỡ"); }
  };

  const isAvailableForShift = (empId: string, shift: Shift) => {
    const avail = empAvailMap[empId];
    if (!avail?.availableDays?.length) return false;
    return avail.availableDays.includes(DAY_MAP[new Date(shift.workingDate + "T00:00:00").getDay()]);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý ca làm</h1>
        <button onClick={openCreate} className="font-body px-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity" style={{ fontSize: 13, fontWeight: 500 }}>
          + Tạo ca
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body" style={{ fontSize: 13 }}>{successMsg}</div>
      )}

      {/* Week nav + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button onClick={prevWeek} className="font-body w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] hover:bg-white text-[var(--cafe-primary)]" style={{ fontSize: 18 }}>‹</button>
          <span className="font-body text-[var(--cafe-primary)] px-3 py-1.5 bg-white border border-[var(--cafe-border)] rounded-lg" style={{ fontSize: 13, fontWeight: 500, minWidth: 170, textAlign: "center" }}>
            {formatWeekRange()}
          </span>
          <button onClick={nextWeek} className="font-body w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] hover:bg-white text-[var(--cafe-primary)]" style={{ fontSize: 18 }}>›</button>
        </div>
        <button onClick={() => setCurrentWeekStart(getWeekStart(new Date()))} className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white bg-white text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 500 }}>
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
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-hidden">
          {/* Day header */}
          <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", borderBottom: "1px solid var(--cafe-border)" }}>
            <div />
            {weekDates.map((d, i) => (
              <div key={i} className="font-body text-center py-3" style={{ borderLeft: "1px solid var(--cafe-border)" }}>
                <div className="font-body" style={{ fontSize: 11, fontWeight: 600, color: isToday(d) ? "var(--cafe-gold)" : "var(--cafe-primary)", opacity: isToday(d) ? 1 : 0.5, textTransform: "uppercase" }}>
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
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 290px)" }}>
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

            {/* Shift blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", marginTop: `-${HOURS.length * CELL_H}px`, pointerEvents: "none" }}>
              <div />
              {weekDates.map((d, di) => (
                <div key={di} style={{ position: "relative", height: HOURS.length * CELL_H, pointerEvents: "auto" }}>
                  {shiftsForDate(d).map((shift) => {
                    const sc = statusColors[shift.status] || statusColors.PLANNED;
                    const top = timeToY(shift.startTime);
                    const height = Math.max(timeToY(shift.endTime) - top, 24);
                    return (
                      <div
                        key={shift.shiftId}
                        onClick={(e) => { e.stopPropagation(); setSelectedShift(shift); setPopoverPos({ x: e.clientX, y: e.clientY }); }}
                        style={{
                          position: "absolute", top, height, left: 3, right: 3,
                          borderRadius: 6,
                          backgroundColor: sc.bg, color: sc.text,
                          border: `1.5px solid ${sc.text}44`,
                          cursor: "pointer", padding: "3px 6px", overflow: "hidden", zIndex: 1,
                        }}
                      >
                        <p className="font-body" style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {shift.shiftName}
                        </p>
                        <p className="font-body" style={{ fontSize: 10, opacity: 0.75 }}>{shift.startTime}–{shift.endTime}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shift popover */}
      {selectedShift && popoverPos && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setSelectedShift(null)} />
          <div className="fixed z-40 bg-white rounded-xl border border-[var(--cafe-border)] p-4"
            style={{
              width: 208,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              top: Math.min(popoverPos.y + 8, window.innerHeight - 180),
              left: Math.min(popoverPos.x + 8, window.innerWidth - 224),
            }}
          >
            <button onClick={() => setSelectedShift(null)} className="absolute top-2 right-3 font-body text-[var(--cafe-primary)] hover:opacity-80" style={{ fontSize: 18, lineHeight: 1, opacity: 0.4 }}>×</button>
            <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600, paddingRight: 20 }}>{selectedShift.shiftName}</p>
            <p className="font-body text-[var(--cafe-primary)] mt-1" style={{ fontSize: 11, opacity: 0.6 }}>{selectedShift.startTime} – {selectedShift.endTime}</p>
            <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 11, opacity: 0.6 }}>{formatDateVN(selectedShift.workingDate)}</p>
            <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--cafe-border)]">
              <button onClick={() => { openEdit(selectedShift); setSelectedShift(null); }} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12, fontWeight: 500 }}>Sửa</button>
              <button onClick={() => { setDeleteShift(selectedShift); setSelectedShift(null); }} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12, fontWeight: 500 }}>Hủy ca</button>
              <button onClick={() => { openAssignment(selectedShift); setSelectedShift(null); }} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12, fontWeight: 500 }}>Phân công</button>
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
              {editingId ? "Sửa ca" : "Tạo ca mới"}
            </h2>
            {error && <p className="font-body text-[var(--cafe-red)] mb-3" style={{ fontSize: 13 }}>{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Tên ca</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Ca sáng" className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-[var(--cafe-primary)]" style={{ fontSize: 14 }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Giờ bắt đầu</label>
                  <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-[var(--cafe-primary)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Giờ kết thúc</label>
                  <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-[var(--cafe-primary)]" style={{ fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Ngày làm</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-[var(--cafe-primary)]" style={{ fontSize: 14 }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFormOpen(false)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleSave} disabled={formSaving} className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {formSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteShift(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Hủy ca</h2>
            <p className="font-body text-[var(--cafe-primary)] mb-6" style={{ fontSize: 14, opacity: 0.7 }}>
              Bạn có chắc muốn hủy ca <strong>{deleteShift.shiftName}</strong> ngày {formatDateVN(deleteShift.workingDate)}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteShift(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 500 }}>Quay lại</button>
              <button onClick={handleDelete} disabled={deleting} className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {deleting ? "Đang xử lý..." : "Hủy ca"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Dialog */}
      {assignShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAssignShift(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Phân công</h2>
            <p className="font-body text-[var(--cafe-primary)] mb-4" style={{ fontSize: 13, opacity: 0.6 }}>
              {assignShift.shiftName} — {formatDateVN(assignShift.workingDate)}
            </p>

            <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>Đã gán ({assignments.length})</h3>
            {assignments.length === 0 ? (
              <p className="font-body text-[var(--cafe-primary)] mb-4" style={{ fontSize: 13, opacity: 0.5 }}>Chưa có nhân viên nào</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {assignments.map((a) => {
                  const emp = activeEmployees.find((e) => e.employeeId === a.employeeId);
                  return (
                    <li key={a.employeeId} className="flex items-center justify-between px-3 py-2 bg-[var(--cafe-bg)] rounded-lg">
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{emp?.fullName || a.employeeId}</span>
                      <button onClick={() => handleRemoveAssignment(a.employeeId)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>Gỡ</button>
                    </li>
                  );
                })}
              </ul>
            )}

            <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>Thêm nhân viên</h3>
            <div className="space-y-2 mb-4 max-h-[240px] overflow-y-auto">
              {activeEmployees
                .filter((e) => !assignments.some((a) => a.employeeId === e.employeeId))
                .sort((a, b) => (isAvailableForShift(b.employeeId, assignShift!) ? 1 : 0) - (isAvailableForShift(a.employeeId, assignShift!) ? 1 : 0))
                .map((e) => {
                  const avail = empAvailMap[e.employeeId];
                  const dayMatch = isAvailableForShift(e.employeeId, assignShift!);
                  return (
                    <div key={e.employeeId} className="flex items-center justify-between px-3 py-2 rounded-lg border"
                      style={{ borderColor: dayMatch ? "#16a34a" : "var(--cafe-border)", backgroundColor: dayMatch ? "#f0fdf4" : "white" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[var(--cafe-primary)] truncate" style={{ fontSize: 13, fontWeight: 500 }}>{e.fullName}</span>
                          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 11, opacity: 0.5 }}>{e.position}</span>
                          {dayMatch && <span className="font-body px-1.5 py-0.5 rounded text-white" style={{ fontSize: 10, fontWeight: 600, backgroundColor: "#16a34a" }}>Rảnh</span>}
                        </div>
                        {avail?.availableDays?.length ? (
                          <div className="flex items-center gap-1 mt-1">
                            {avail.availableDays.map((d) => {
                              const shiftDay = DAY_MAP[new Date(assignShift!.workingDate + "T00:00:00").getDay()];
                              const isMatch = d === shiftDay;
                              return (
                                <span key={d} className="font-body px-1 py-0.5 rounded" style={{ fontSize: 9, fontWeight: 600, backgroundColor: isMatch ? "#16a34a" : "var(--cafe-accent)", color: isMatch ? "#fff" : "var(--cafe-primary)" }}>
                                  {DAY_LABELS[d] || d}
                                </span>
                              );
                            })}
                            {avail.availableTimeRanges?.length > 0 && (
                              <span className="font-body text-[var(--cafe-primary)] ml-1" style={{ fontSize: 9, opacity: 0.4 }}>
                                {avail.availableTimeRanges.map((r) => `${r.start}-${r.end}`).join(", ")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-body text-[var(--cafe-primary)] mt-0.5 block" style={{ fontSize: 10, opacity: 0.3 }}>Chưa cập nhật lịch rảnh</span>
                        )}
                      </div>
                      <button onClick={() => handleAssignDirect(e.employeeId)} disabled={assigning}
                        className="font-body ml-2 px-3 py-1.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 shrink-0"
                        style={{ fontSize: 12, fontWeight: 500 }}>
                        Gán
                      </button>
                    </div>
                  );
                })}
              {activeEmployees.filter((e) => !assignments.some((a) => a.employeeId === e.employeeId)).length === 0 && (
                <p className="font-body text-[var(--cafe-primary)] text-center py-2" style={{ fontSize: 13, opacity: 0.5 }}>Tất cả nhân viên đã được gán</p>
              )}
            </div>

            <button onClick={() => setAssignShift(null)} className="font-body w-full py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
