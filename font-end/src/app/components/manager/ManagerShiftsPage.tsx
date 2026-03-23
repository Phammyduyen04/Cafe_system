import { useEffect, useState } from "react";
import { staffService, type Shift, type Assignment, type Employee, type Availability } from "../../../services/staff.service";

export default function ManagerShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    loadShifts();
  }, [page, filterDate, filterStatus]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await staffService.getShifts({
        page, limit: 10,
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      const data = res as any;
      setShifts(Array.isArray(data) ? data : data?.data ?? data?.shifts ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormStart("08:00");
    setFormEnd("17:00");
    setFormDate(new Date().toISOString().split("T")[0]);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditingId(shift.shiftId);
    setFormName(shift.shiftName);
    setFormStart(shift.startTime);
    setFormEnd(shift.endTime);
    setFormDate(shift.workingDate);
    setError("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setError("Nhập tên ca"); return; }
    if (!formDate) { setError("Chọn ngày"); return; }
    try {
      setFormSaving(true);
      setError("");
      if (editingId) {
        await staffService.updateShift(editingId, {
          shiftName: formName,
          startTime: formStart,
          endTime: formEnd,
          workingDate: formDate,
        });
        setSuccessMsg("Cập nhật ca thành công!");
      } else {
        await staffService.createShift({
          shiftName: formName,
          startTime: formStart,
          endTime: formEnd,
          workingDate: formDate,
        });
        setSuccessMsg("Tạo ca thành công!");
      }
      setFormOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadShifts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteShift) return;
    try {
      setDeleting(true);
      await staffService.deleteShift(deleteShift.shiftId);
      setDeleteShift(null);
      setSuccessMsg("Đã hủy ca!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadShifts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi hủy ca");
    } finally {
      setDeleting(false);
    }
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

      // Fetch availability for all employees
      const availResults = await Promise.allSettled(
        empList.map((e) => staffService.getAvailability(e.employeeId))
      );
      const availMap: Record<string, Availability> = {};
      empList.forEach((e, i) => {
        const r = availResults[i];
        if (r.status === "fulfilled" && r.value) {
          availMap[e.employeeId] = r.value;
        }
      });
      setEmpAvailMap(availMap);
    } catch {
      setAssignments([]);
      setActiveEmployees([]);
    }
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
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (empId: string) => {
    if (!assignShift) return;
    try {
      await staffService.removeAssignment(assignShift.shiftId, empId);
      const asgn = await staffService.getAssignments(assignShift.shiftId);
      setAssignments(Array.isArray(asgn) ? asgn : []);
    } catch (err: any) {
      alert(err.message || "Lỗi khi gỡ");
    }
  };

  const DAY_MAP: Record<number, string> = { 0: "SUN", 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };
  const DAY_LABELS: Record<string, string> = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" };

  const formatDateVN = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${days[d.getDay()]}, ${dateStr}`;
  };

  const isAvailableForShift = (empId: string, shift: Shift) => {
    const avail = empAvailMap[empId];
    if (!avail?.availableDays?.length) return false;
    const dayOfWeek = new Date(shift.workingDate + "T00:00:00").getDay();
    return avail.availableDays.includes(DAY_MAP[dayOfWeek]);
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    PLANNED: { bg: "#dbeafe", text: "#2563eb" },
    ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
    COMPLETED: { bg: "#f3f4f6", text: "#6b7280" },
    CANCELLED: { bg: "#fef2f2", text: "#dc2626" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý ca làm</h1>
        <button onClick={openCreate} className="font-body px-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity" style={{ fontSize: 13, fontWeight: 500 }}>
          + Tạo ca
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setPage(1); }} className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }} />
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="PLANNED">PLANNED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        {(filterDate || filterStatus) && (
          <button onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="font-body px-3 py-2 text-[var(--cafe-red)] hover:underline" style={{ fontSize: 13 }}>Xóa bộ lọc</button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Không có ca nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên ca", "Giờ", "Ngày", "Trạng thái", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const sc = statusColors[shift.status] || statusColors.PLANNED;
                return (
                  <tr key={shift.shiftId} className="border-b border-[var(--cafe-bg)] last:border-0">
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{shift.shiftName}</td>
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{shift.startTime} — {shift.endTime}</td>
                    <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{formatDateVN(shift.workingDate)}</td>
                    <td className="px-4 py-3">
                      <span className="font-body px-2.5 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: sc.bg, color: sc.text }}>{shift.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(shift)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                        <button onClick={() => setDeleteShift(shift)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>Hủy ca</button>
                        <button onClick={() => openAssignment(shift)} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>Phân công</button>
                      </div>
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40" style={{ fontSize: 13 }}>Trước</button>
          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40" style={{ fontSize: 13 }}>Sau</button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
              {editingId ? "Sửa ca" : "Tạo ca mới"}
            </h2>
            {error && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Tên ca</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Ca sáng" className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Giờ bắt đầu</label>
                  <input type="time" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Giờ kết thúc</label>
                  <input type="time" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Ngày làm</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setFormOpen(false)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
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
            <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
              Bạn có chắc muốn hủy ca <strong>{deleteShift.shiftName}</strong> ngày {formatDateVN(deleteShift.workingDate)}?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteShift(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Quay lại</button>
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
            <p className="font-body text-[var(--cafe-primary)]/60 mb-4" style={{ fontSize: 13 }}>
              {assignShift.shiftName} — {formatDateVN(assignShift.workingDate)}
            </p>

            {/* Assigned list */}
            <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>
              Đã gán ({assignments.length})
            </h3>
            {assignments.length === 0 ? (
              <p className="font-body text-[var(--cafe-primary)]/50 mb-4" style={{ fontSize: 13 }}>Chưa có nhân viên nào</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {assignments.map((a) => {
                  const emp = activeEmployees.find((e) => e.employeeId === a.employeeId);
                  return (
                    <li key={a.employeeId} className="flex items-center justify-between px-3 py-2 bg-[var(--cafe-bg)] rounded-lg">
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                        {emp?.fullName || a.employeeId}
                      </span>
                      <button onClick={() => handleRemoveAssignment(a.employeeId)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>
                        Gỡ
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Assign new */}
            <h3 className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 14, fontWeight: 600 }}>Thêm nhân viên</h3>
            <div className="space-y-2 mb-4 max-h-[240px] overflow-y-auto">
              {activeEmployees
                .filter((e) => !assignments.some((a) => a.employeeId === e.employeeId))
                .sort((a, b) => {
                  const aOk = isAvailableForShift(a.employeeId, assignShift!) ? 1 : 0;
                  const bOk = isAvailableForShift(b.employeeId, assignShift!) ? 1 : 0;
                  return bOk - aOk;
                })
                .map((e) => {
                  const avail = empAvailMap[e.employeeId];
                  const dayMatch = isAvailableForShift(e.employeeId, assignShift!);
                  return (
                    <div
                      key={e.employeeId}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border"
                      style={{ borderColor: dayMatch ? "#16a34a" : "var(--cafe-border)", backgroundColor: dayMatch ? "#f0fdf4" : "white" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-[var(--cafe-primary)] truncate" style={{ fontSize: 13, fontWeight: 500 }}>{e.fullName}</span>
                          <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>{e.position}</span>
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
                              <span className="font-body text-[var(--cafe-primary)]/40 ml-1" style={{ fontSize: 9 }}>
                                {avail.availableTimeRanges.map((r) => `${r.start}-${r.end}`).join(", ")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-body text-[var(--cafe-primary)]/30 mt-0.5 block" style={{ fontSize: 10 }}>Chưa cập nhật lịch rảnh</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAssignDirect(e.employeeId)}
                        disabled={assigning}
                        className="font-body ml-2 px-3 py-1.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 shrink-0"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        Gán
                      </button>
                    </div>
                  );
                })}
              {activeEmployees.filter((e) => !assignments.some((a) => a.employeeId === e.employeeId)).length === 0 && (
                <p className="font-body text-[var(--cafe-primary)]/50 text-center py-2" style={{ fontSize: 13 }}>Tất cả nhân viên đã được gán</p>
              )}
            </div>

            <button onClick={() => setAssignShift(null)} className="font-body w-full py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
