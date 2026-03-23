import { useEffect, useState } from "react";
import { promotionService, type Discount } from "../../../services/promotion.service";

type TimeFrameRow = { from: string; to: string };

function TimeFrameRows({
  rows,
  setRows,
}: {
  rows: TimeFrameRow[];
  setRows: (rows: TimeFrameRow[]) => void;
}) {
  const update = (i: number, field: keyof TimeFrameRow, val: string) => {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const add = () => setRows([...rows, { from: "", to: "" }]);

  return (
    <div>
      <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
        Khung giờ áp dụng
      </label>
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              value={row.from}
              onChange={(e) => update(i, "from", e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
              style={{ fontSize: 13 }}
            />
            <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>đến</span>
            <input
              type="time"
              value={row.to}
              onChange={(e) => update(i, "to", e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
              style={{ fontSize: 13 }}
            />
            <button
              onClick={() => remove(i)}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] text-[var(--cafe-red)] hover:bg-red-50 transition-colors flex-shrink-0"
              style={{ fontSize: 16 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        type="button"
        className="font-body text-[var(--cafe-gold)] hover:underline"
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        + Thêm khung giờ
      </button>
    </div>
  );
}

export default function ManagerDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDiscountId, setFormDiscountId] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [formValue, setFormValue] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deleteDisc, setDeleteDisc] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Conditions dialog
  const [condDisc, setCondDisc] = useState<Discount | null>(null);
  const [condMinOrder, setCondMinOrder] = useState("");
  const [custTypeRegular, setCustTypeRegular] = useState(false);
  const [custTypeVip, setCustTypeVip] = useState(false);
  const [condProductIds, setCondProductIds] = useState("");
  const [condCategoryIds, setCondCategoryIds] = useState("");
  const [timeFrameRows, setTimeFrameRows] = useState<TimeFrameRow[]>([]);
  const [condSaving, setCondSaving] = useState(false);
  const [condError, setCondError] = useState("");

  useEffect(() => {
    loadDiscounts();
  }, [page, filterStatus]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = await promotionService.getDiscounts({
        page, limit: 10,
        status: filterStatus || undefined,
      });
      const data = res as any;
      setDiscounts(Array.isArray(data) ? data : data?.data ?? data?.discounts ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormDiscountId("");
    setFormName("");
    setFormType("PERCENT");
    setFormValue("");
    setFormDesc("");
    setFormStart("");
    setFormEnd("");
    setError("");
    setFormOpen(true);
  };

  const openEdit = (disc: Discount) => {
    setEditingId(disc.discountId);
    setFormDiscountId(disc.discountId);
    setFormName(disc.discountName);
    setFormType(disc.discountType as "PERCENT" | "FIXED");
    setFormValue(String(disc.discountValue));
    setFormDesc(disc.description || "");
    setFormStart(disc.startDate?.split("T")[0] || "");
    setFormEnd(disc.endDate?.split("T")[0] || "");
    setError("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setError("Nhập tên giảm giá"); return; }
    const val = parseFloat(formValue);
    if (isNaN(val) || val <= 0) { setError("Nhập giá trị hợp lệ"); return; }
    try {
      setFormSaving(true);
      setError("");
      if (editingId) {
        await promotionService.updateDiscount(editingId, {
          discountName: formName,
          discountType: formType,
          discountValue: val,
          description: formDesc,
          startDate: formStart || null,
          endDate: formEnd || null,
        });
        setSuccessMsg("Cập nhật giảm giá thành công!");
      } else {
        if (!formDiscountId.trim()) { setError("Nhập mã giảm giá"); setFormSaving(false); return; }
        await promotionService.createDiscount({
          discountId: formDiscountId,
          discountName: formName,
          discountType: formType,
          discountValue: val,
          description: formDesc || undefined,
          startDate: formStart || undefined,
          endDate: formEnd || undefined,
        });
        setSuccessMsg("Tạo giảm giá thành công!");
      }
      setFormOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadDiscounts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDisc) return;
    try {
      setDeleting(true);
      await promotionService.deleteDiscount(deleteDisc.discountId);
      setDeleteDisc(null);
      setSuccessMsg("Đã xóa giảm giá!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadDiscounts();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  const openConditions = async (disc: Discount) => {
    setCondDisc(disc);
    setCondSaving(false);
    setCondError("");
    try {
      const detail = await promotionService.getDiscountById(disc.discountId);
      const cond = (detail as any)?.conditions;
      setCondMinOrder(cond?.minimumOrderAmount != null ? String(cond.minimumOrderAmount) : "");
      const types: string[] = cond?.applicableCustomerTypes ?? [];
      setCustTypeRegular(types.includes("REGULAR"));
      setCustTypeVip(types.includes("VIP"));
      setCondProductIds(cond?.applicableProductIds?.join(", ") || "");
      setCondCategoryIds(cond?.applicableCategoryIds?.join(", ") || "");
      setTimeFrameRows(
        (cond?.timeFrames ?? []).map((t: any) => ({ from: t.from ?? "", to: t.to ?? "" }))
      );
    } catch {
      setCondMinOrder("");
      setCustTypeRegular(false);
      setCustTypeVip(false);
      setCondProductIds("");
      setCondCategoryIds("");
      setTimeFrameRows([]);
    }
  };

  const handleCondSave = async () => {
    if (!condDisc) return;
    try {
      setCondSaving(true);
      setCondError("");
      await promotionService.updateDiscountConditions(condDisc.discountId, {
        minimumOrderAmount: condMinOrder ? parseFloat(condMinOrder) : null,
        applicableCustomerTypes: [
          ...(custTypeRegular ? ["REGULAR"] : []),
          ...(custTypeVip ? ["VIP"] : []),
        ],
        applicableProductIds: condProductIds ? condProductIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
        applicableCategoryIds: condCategoryIds ? condCategoryIds.split(",").map((s) => s.trim()).filter(Boolean) : [],
        timeFrames: timeFrameRows.filter((r) => r.from && r.to),
      });
      setCondDisc(null);
      setSuccessMsg("Cập nhật điều kiện thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setCondError(err.message || "Lỗi khi cập nhật điều kiện");
    } finally {
      setCondSaving(false);
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

  const typeBadge = (type: string) => (
    <span className="font-body inline-block px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: type === "PERCENT" ? "#dbeafe" : "#fef9c3", color: type === "PERCENT" ? "#2563eb" : "#ca8a04" }}>
      {type}
    </span>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý giảm giá</h1>
        <button onClick={openCreate} className="font-body px-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity" style={{ fontSize: 13, fontWeight: 500 }}>
          + Tạo giảm giá
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
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
      ) : discounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Không có giảm giá nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Mã", "Tên", "Loại", "Giá trị", "Trạng thái", "Bắt đầu", "Kết thúc", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((disc) => (
                <tr key={disc.discountId} className="border-b border-[var(--cafe-bg)] last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-body text-[var(--cafe-primary)]/50 bg-[var(--cafe-bg)] px-2 py-0.5 rounded" style={{ fontSize: 11, fontFamily: "monospace" }}>
                      {disc.discountId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{disc.discountName}</td>
                  <td className="px-4 py-3">{typeBadge(disc.discountType)}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>
                    {disc.discountType === "PERCENT" ? `${disc.discountValue}%` : `${disc.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="px-4 py-3">{statusBadge(disc.status)}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 12 }}>{disc.startDate?.split("T")[0] || "—"}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 12 }}>{disc.endDate?.split("T")[0] || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(disc)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      <button onClick={() => setDeleteDisc(disc)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>Xóa</button>
                      <button onClick={() => openConditions(disc)} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>Điều kiện</button>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 22, fontWeight: 600 }}>
              {editingId ? "Sửa giảm giá" : "Tạo giảm giá"}
            </h2>
            {error && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{error}</p>}
            <div className="space-y-4">
              {!editingId && (
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Mã giảm giá</label>
                  <input value={formDiscountId} onChange={(e) => setFormDiscountId(e.target.value)} placeholder="VD: DISC_001" className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              )}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Tên giảm giá</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Loại</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as any)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }}>
                    <option value="PERCENT">PERCENT (%)</option>
                    <option value="FIXED">FIXED (đ)</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Giá trị {formType === "PERCENT" ? "(%)" : "(đ)"}
                  </label>
                  <input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder={formType === "PERCENT" ? "VD: 10" : "VD: 50000"} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Mô tả</label>
                <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Bắt đầu</label>
                  <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Kết thúc</label>
                  <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
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
      {deleteDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteDisc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Xóa giảm giá</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
              Bạn có chắc muốn xóa <strong>{deleteDisc.discountName}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDisc(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleting} className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conditions Dialog */}
      {condDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCondDisc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Điều kiện giảm giá</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>{condDisc.discountName}</p>

            {condError && (
              <p className="font-body text-[var(--cafe-red)] mb-4 text-sm">{condError}</p>
            )}

            <div className="space-y-5">
              {/* Min order */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Giá trị đơn tối thiểu (đ)
                </label>
                <input
                  type="number"
                  value={condMinOrder}
                  onChange={(e) => setCondMinOrder(e.target.value)}
                  placeholder="Để trống nếu không giới hạn"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14 }}
                />
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Customer types — checkboxes */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
                  Loại khách hàng áp dụng
                </label>
                <div className="flex gap-6">
                  {[
                    { key: "regular", label: "REGULAR", checked: custTypeRegular, set: setCustTypeRegular },
                    { key: "vip", label: "VIP", checked: custTypeVip, set: setCustTypeVip },
                  ].map(({ key, label, checked, set }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => set(e.target.checked)}
                        className="w-4 h-4 accent-[var(--cafe-gold)]"
                      />
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                    </label>
                  ))}
                </div>
                <p className="font-body text-[var(--cafe-primary)]/40 mt-1" style={{ fontSize: 11 }}>
                  Không chọn = áp dụng tất cả loại KH
                </p>
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Product IDs */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Product IDs áp dụng
                </label>
                <input
                  value={condProductIds}
                  onChange={(e) => setCondProductIds(e.target.value)}
                  placeholder="VD: prod_1, prod_2 (phân cách bởi dấu phẩy)"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Category IDs */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Category IDs áp dụng
                </label>
                <input
                  value={condCategoryIds}
                  onChange={(e) => setCondCategoryIds(e.target.value)}
                  placeholder="VD: cat_1, cat_2 (phân cách bởi dấu phẩy)"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 13 }}
                />
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Time frames */}
              <TimeFrameRows rows={timeFrameRows} setRows={setTimeFrameRows} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCondDisc(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleCondSave} disabled={condSaving} className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {condSaving ? "Đang lưu..." : "Lưu điều kiện"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
