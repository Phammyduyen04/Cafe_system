import { useEffect, useState } from "react";
import { staffService, type Employee, type Availability } from "../../../services/staff.service";

const POSITIONS = ["Barista", "Cashier", "Kitchen", "Cleaner", "Manager"];
const EMP_TYPES = ["FULL_TIME", "PART_TIME"];
const DAY_LABELS: Record<string, string> = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" };

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("Barista");
  const [formType, setFormType] = useState("FULL_TIME");
  const [formHours, setFormHours] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Availability dialog
  const [availEmp, setAvailEmp] = useState<Employee | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);

  useEffect(() => {
    loadEmployees();
  }, [page, filterStatus, filterPosition]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await staffService.getEmployees({
        page, limit: 10,
        status: filterStatus || undefined,
        position: filterPosition || undefined,
      });
      const data = res as any;
      setEmployees(Array.isArray(data) ? data : data?.data ?? data?.employees ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormPosition("Barista");
    setFormType("FULL_TIME");
    setFormHours("");
    setError("");
    setFormOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.employeeId);
    setFormName(emp.fullName);
    setFormPosition(emp.position);
    setFormType(emp.employeeType);
    setFormHours(emp.maxWorkingHours != null ? String(emp.maxWorkingHours) : "");
    setError("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setError("Nhập tên nhân viên"); return; }
    try {
      setFormSaving(true);
      setError("");
      if (editingId) {
        await staffService.updateEmployee(editingId, {
          fullName: formName,
          position: formPosition,
          employeeType: formType as any,
          maxWorkingHours: formHours ? parseInt(formHours) : null,
        });
        setSuccessMsg("Cập nhật nhân viên thành công!");
      } else {
        await staffService.createEmployee({
          fullName: formName,
          position: formPosition,
          employeeType: formType,
          maxWorkingHours: formHours ? parseInt(formHours) : undefined,
        });
        setSuccessMsg("Thêm nhân viên thành công!");
      }
      setFormOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadEmployees();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    try {
      setDeleting(true);
      await staffService.deleteEmployee(deleteEmp.employeeId);
      setDeleteEmp(null);
      setSuccessMsg("Đã vô hiệu hóa nhân viên!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadEmployees();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  const openAvailability = async (emp: Employee) => {
    setAvailEmp(emp);
    try {
      const avail = await staffService.getAvailability(emp.employeeId);
      setAvailability(avail);
    } catch {
      setAvailability(null);
    }
  };

  const statusBadge = (status: string) => {
    const active = status === "ACTIVE";
    return (
      <span className="font-body inline-block px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: active ? "#dcfce7" : "#fef2f2", color: active ? "#16a34a" : "#dc2626" }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý nhân viên</h1>
        <button onClick={openCreate} className="font-body px-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity" style={{ fontSize: 13, fontWeight: 500 }}>
          + Thêm nhân viên
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterPosition} onChange={(e) => { setFilterPosition(e.target.value); setPage(1); }} className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }}>
          <option value="">Tất cả vị trí</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Không có nhân viên</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên", "Vị trí", "Loại", "Giờ max", "Trạng thái", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="border-b border-[var(--cafe-bg)] last:border-0">
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{emp.fullName}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{emp.position}</td>
                  <td className="px-4 py-3">
                    <span className="font-body px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: emp.employeeType === "FULL_TIME" ? "#dbeafe" : "#fef9c3", color: emp.employeeType === "FULL_TIME" ? "#2563eb" : "#ca8a04" }}>
                      {emp.employeeType}
                    </span>
                  </td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{emp.maxWorkingHours ?? "—"}</td>
                  <td className="px-4 py-3">{statusBadge(emp.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(emp)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      <button onClick={() => setDeleteEmp(emp)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>Xóa</button>
                      <button onClick={() => openAvailability(emp)} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>Lịch rảnh</button>
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
              {editingId ? "Sửa nhân viên" : "Thêm nhân viên"}
            </h2>
            {error && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Họ tên</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Vị trí</label>
                <select value={formPosition} onChange={(e) => setFormPosition(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Loại nhân viên</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }}>
                  {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Giờ làm tối đa (tuần)</label>
                <input type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="VD: 40" className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
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
      {deleteEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteEmp(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Vô hiệu hóa nhân viên</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
              Bạn có chắc muốn vô hiệu hóa <strong>{deleteEmp.fullName}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEmp(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleting} className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {deleting ? "Đang xử lý..." : "Vô hiệu hóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Dialog */}
      {availEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAvailEmp(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 20, fontWeight: 600 }}>Lịch rảnh</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-4" style={{ fontSize: 13 }}>{availEmp.fullName}</p>
            {!availability ? (
              <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>Chưa cập nhật lịch rảnh</p>
            ) : (
              <>
                <div className="mb-3">
                  <p className="font-body text-[var(--cafe-primary)] mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Ngày rảnh:</p>
                  <div className="flex flex-wrap gap-1">
                    {(availability.availableDays?.length ?? 0) === 0 ? (
                      <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 12 }}>Chưa chọn</span>
                    ) : (
                      availability.availableDays.map((d) => (
                        <span key={d} className="font-body px-2 py-0.5 bg-[var(--cafe-accent)] rounded" style={{ fontSize: 11, fontWeight: 500 }}>{DAY_LABELS[d] || d}</span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-body text-[var(--cafe-primary)] mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Khung giờ:</p>
                  {(availability.availableTimeRanges?.length ?? 0) === 0 ? (
                    <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 12 }}>Chưa có</span>
                  ) : (
                    <div className="space-y-1">
                      {availability.availableTimeRanges.map((r, i) => (
                        <p key={i} className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{r.start} — {r.end}</p>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <button onClick={() => setAvailEmp(null)} className="font-body w-full mt-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
