import { useEffect, useState } from "react";
import { staffService, type Employee, type Availability } from "../../../services/staff.service";

const POSITIONS = ["BARISTA", "CASHIER", "WAITER", "KITCHEN_STAFF", "MANAGER", "CLEANER", "OTHER"];
const EMP_TYPES = ["FULL_TIME", "PART_TIME"];
const DAY_LABELS: Record<string, string> = { MON: "T2", TUE: "T3", WED: "T4", THU: "T5", FRI: "T6", SAT: "T7", SUN: "CN" };

export default function ManagerEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterHasAccount, setFilterHasAccount] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("BARISTA");
  const [formType, setFormType] = useState("FULL_TIME");
  const [formHours, setFormHours] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Deactivate dialog
  const [deactivateEmp, setDeactivateEmp] = useState<Employee | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");

  // Activate dialog
  const [activateEmp, setActivateEmp] = useState<Employee | null>(null);
  const [activateReason, setActivateReason] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  // Availability dialog
  const [availEmp, setAvailEmp] = useState<Employee | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);

  useEffect(() => { loadEmployees(); }, [page, filterStatus, filterPosition, filterHasAccount]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const hasAccountParam =
        filterHasAccount === "true" ? true : filterHasAccount === "false" ? false : undefined;
      const res = await staffService.getEmployees({
        page, limit: 10,
        status: filterStatus || undefined,
        position: filterPosition || undefined,
        hasAccount: hasAccountParam,
      });
      const data = res as any;
      setEmployees(Array.isArray(data) ? data : data?.data ?? data?.employees ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally { setLoading(false); }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const openCreate = () => {
    setEditingId(null); setFormName(""); setFormPosition("BARISTA");
    setFormType("FULL_TIME"); setFormHours(""); setFormError(""); setFormOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingId(emp.employeeId); setFormName(emp.fullName);
    setFormPosition(emp.position); setFormType(emp.employeeType);
    setFormHours(emp.maxWorkingHours != null ? String(emp.maxWorkingHours) : "");
    setFormError(""); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Nhập tên nhân viên"); return; }
    try {
      setFormSaving(true); setFormError("");
      if (editingId) {
        await staffService.updateEmployee(editingId, {
          fullName: formName, position: formPosition,
          employeeType: formType as any,
          maxWorkingHours: formHours ? parseInt(formHours) : null,
        });
        showSuccess("Cập nhật nhân viên thành công!");
      } else {
        await staffService.createEmployee({
          fullName: formName, position: formPosition,
          employeeType: formType,
          maxWorkingHours: formHours ? parseInt(formHours) : undefined,
        });
        showSuccess("Thêm nhân viên thành công!");
      }
      setFormOpen(false); loadEmployees();
    } catch (err: any) { setFormError(err.message || "Lỗi khi lưu"); }
    finally { setFormSaving(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateEmp) return;
    if (!deactivateReason.trim()) { setDeactivateError("Vui lòng nhập lý do"); return; }
    try {
      setDeactivating(true); setDeactivateError("");
      await staffService.deactivateEmployee(deactivateEmp.employeeId, deactivateReason.trim());
      setDeactivateEmp(null); setDeactivateReason("");
      showSuccess("Đã vô hiệu hóa nhân viên!"); loadEmployees();
    } catch (err: any) { setDeactivateError(err.message || "Lỗi khi vô hiệu hóa"); }
    finally { setDeactivating(false); }
  };

  const handleActivate = async () => {
    if (!activateEmp) return;
    if (!activateReason.trim()) { setActivateError("Vui lòng nhập lý do"); return; }
    try {
      setActivating(true); setActivateError("");
      await staffService.reactivateEmployee(activateEmp.employeeId, activateReason.trim());
      setActivateEmp(null); setActivateReason("");
      showSuccess("Đã kích hoạt lại nhân viên!"); loadEmployees();
    } catch (err: any) { setActivateError(err.message || "Lỗi khi kích hoạt"); }
    finally { setActivating(false); }
  };

  const openAvailability = async (emp: Employee) => {
    setAvailEmp(emp);
    try { setAvailability(await staffService.getAvailability(emp.employeeId)); }
    catch { setAvailability(null); }
  };

  const statusBadge = (status: string) => {
    const active = status === "ACTIVE";
    return (
      <span className="font-body inline-block px-2 py-0.5 rounded-full"
        style={{ fontSize: 11, fontWeight: 600, backgroundColor: active ? "#dcfce7" : "#fef2f2", color: active ? "#16a34a" : "#dc2626" }}>
        {status}
      </span>
    );
  };

  const inputCls = "font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]";
  const labelCls = "font-body text-[var(--cafe-primary)] block mb-1";
  const selectCls = "font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]";

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
        <select value={filterPosition} onChange={(e) => { setFilterPosition(e.target.value); setPage(1); }} className={selectCls} style={{ fontSize: 13, width: "auto" }}>
          <option value="">Tất cả vị trí</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className={selectCls} style={{ fontSize: 13, width: "auto" }}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <select value={filterHasAccount} onChange={(e) => { setFilterHasAccount(e.target.value); setPage(1); }} className={selectCls} style={{ fontSize: 13, width: "auto" }}>
          <option value="">Tất cả tài khoản</option>
          <option value="true">Đã có tài khoản</option>
          <option value="false">Chưa có tài khoản</option>
        </select>
        {(filterPosition || filterStatus || filterHasAccount) && (
          <button onClick={() => { setFilterPosition(""); setFilterStatus(""); setFilterHasAccount(""); setPage(1); }}
            className="font-body px-3 py-2 text-red-500 hover:underline" style={{ fontSize: 13 }}>
            Xóa bộ lọc
          </button>
        )}
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
                {["Họ tên", "Vị trí", "Loại", "Tài khoản", "Trạng thái", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.employeeId} className="border-b border-[var(--cafe-bg)] last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{emp.fullName}</span>
                    {emp.status === "INACTIVE" && emp.inactiveReason && (
                      <p className="font-body text-red-400 mt-0.5" style={{ fontSize: 11 }}>Lý do: {emp.inactiveReason}</p>
                    )}
                  </td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{emp.position}</td>
                  <td className="px-4 py-3">
                    <span className="font-body px-2 py-0.5 rounded-full" style={{
                      fontSize: 11, fontWeight: 600,
                      backgroundColor: emp.employeeType === "FULL_TIME" ? "#dbeafe" : "#fef9c3",
                      color: emp.employeeType === "FULL_TIME" ? "#2563eb" : "#ca8a04",
                    }}>
                      {emp.employeeType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {emp.accountId ? (
                      <span className="font-body inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700" style={{ fontSize: 11, fontWeight: 600 }}>
                        <span style={{ fontSize: 8 }}>●</span> Đã có tài khoản
                      </span>
                    ) : (
                      <span className="font-body inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400" style={{ fontSize: 11, fontWeight: 600 }}>
                        <span style={{ fontSize: 8 }}>○</span> Chưa có
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(emp.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => openEdit(emp)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      {emp.status === "ACTIVE" ? (
                        <button onClick={() => { setDeactivateEmp(emp); setDeactivateReason(""); setDeactivateError(""); }}
                          className="font-body text-red-500 hover:underline" style={{ fontSize: 12 }}>Vô hiệu</button>
                      ) : (
                        <button onClick={() => { setActivateEmp(emp); setActivateReason(""); setActivateError(""); }}
                          className="font-body text-green-600 hover:underline" style={{ fontSize: 12 }}>Kích hoạt</button>
                      )}
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
            {formError && <p className="font-body text-red-500 mb-3 text-sm">{formError}</p>}
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Họ tên</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className={inputCls} style={{ fontSize: 14 }} />
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Vị trí</label>
                <select value={formPosition} onChange={(e) => setFormPosition(e.target.value)} className={selectCls} style={{ fontSize: 14 }}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Loại nhân viên</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={selectCls} style={{ fontSize: 14 }}>
                  {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {formType === "FULL_TIME" && (
                <div>
                  <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Giờ làm tối đa / tuần</label>
                  <input type="number" value={formHours} onChange={(e) => setFormHours(e.target.value)} placeholder="VD: 40" className={inputCls} style={{ fontSize: 14 }} />
                </div>
              )}
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

      {/* Deactivate Dialog */}
      {deactivateEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeactivateEmp(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-red-600 mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Vô hiệu hóa nhân viên</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-4" style={{ fontSize: 14 }}>Nhân viên: <strong>{deactivateEmp.fullName}</strong></p>
            {deactivateError && <p className="font-body text-red-500 mb-3 text-sm">{deactivateError}</p>}
            <div className="mb-4">
              <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Lý do vô hiệu hóa <span className="text-red-500">*</span></label>
              <textarea value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} rows={3}
                placeholder="Nhập lý do..." className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] resize-none" style={{ fontSize: 14 }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeactivateEmp(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleDeactivate} disabled={deactivating} className="font-body flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {deactivating ? "Đang xử lý..." : "Vô hiệu hóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Dialog */}
      {activateEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setActivateEmp(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-green-600 mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Kích hoạt nhân viên</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-4" style={{ fontSize: 14 }}>Nhân viên: <strong>{activateEmp.fullName}</strong></p>
            {activateEmp.inactiveReason && (
              <p className="font-body text-red-400 mb-3 text-sm">Lý do vô hiệu hóa trước: {activateEmp.inactiveReason}</p>
            )}
            {activateError && <p className="font-body text-red-500 mb-3 text-sm">{activateError}</p>}
            <div className="mb-4">
              <label className={labelCls} style={{ fontSize: 13, fontWeight: 500 }}>Lý do kích hoạt lại <span className="text-red-500">*</span></label>
              <textarea value={activateReason} onChange={(e) => setActivateReason(e.target.value)} rows={3}
                placeholder="Nhập lý do..." className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] resize-none" style={{ fontSize: 14 }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActivateEmp(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleActivate} disabled={activating} className="font-body flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {activating ? "Đang xử lý..." : "Kích hoạt"}
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
            <p className="font-body text-[var(--cafe-primary)]/60 mb-1" style={{ fontSize: 13 }}>{availEmp.fullName}</p>
            <span className="font-body px-2 py-0.5 rounded-full mb-4 inline-block" style={{
              fontSize: 11, fontWeight: 600,
              backgroundColor: availEmp.employeeType === "FULL_TIME" ? "#dbeafe" : "#fef9c3",
              color: availEmp.employeeType === "FULL_TIME" ? "#2563eb" : "#ca8a04",
            }}>
              {availEmp.employeeType}
            </span>
            {availEmp.employeeType === "FULL_TIME" ? (
              <p className="font-body text-[var(--cafe-primary)]/50 mt-3" style={{ fontSize: 13 }}>FULL_TIME không cần đăng ký lịch rảnh</p>
            ) : !availability ? (
              <p className="font-body text-[var(--cafe-primary)]/50 mt-3" style={{ fontSize: 13 }}>Chưa cập nhật lịch rảnh</p>
            ) : (
              <>
                <div className="mb-3">
                  <p className="font-body text-[var(--cafe-primary)] mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Ngày rảnh:</p>
                  <div className="flex flex-wrap gap-1">
                    {(availability.availableDays?.length ?? 0) === 0 ? (
                      <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 12 }}>Chưa chọn</span>
                    ) : (
                      availability.availableDays.map((d) => (
                        <span key={d} className="font-body px-2 py-0.5 rounded" style={{ fontSize: 11, fontWeight: 500, backgroundColor: "var(--cafe-bg)", color: "var(--cafe-primary)" }}>{DAY_LABELS[d] || d}</span>
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
