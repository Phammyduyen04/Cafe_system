import { useEffect, useRef, useState } from "react";
import { promotionService, type Discount, type DiscountCondition, type UsageHistory } from "../../../services/promotion.service";
import { productService, type Product, type Category } from "../../../services/product.service";

// ── Helpers ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const resolveDiscountImageUrl = (url: string) =>
  url?.startsWith("/uploads/") ? `${API_BASE}${url}` : url;
type TimeFrameRow = { from: string; to: string };

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "#dcfce7", color: "#16a34a", label: "Đang hoạt động" },
  PLANNED:   { bg: "#dbeafe", color: "#2563eb", label: "Sắp diễn ra" },
  EXPIRED:   { bg: "#f3f4f6", color: "#6b7280", label: "Đã hết hạn" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Đã hủy" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.CANCELLED;
  return (
    <span className="font-body inline-block px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="font-body inline-block px-2 py-0.5 rounded-full"
      style={{ fontSize: 11, fontWeight: 600, backgroundColor: type === "PERCENT" ? "#dbeafe" : "#fef9c3", color: type === "PERCENT" ? "#2563eb" : "#ca8a04" }}>
      {type === "PERCENT" ? "Phần trăm" : "Số tiền cố định"}
    </span>
  );
}

function TimeFrameRows({ rows, setRows }: { rows: TimeFrameRow[]; setRows: (r: TimeFrameRow[]) => void }) {
  const update = (i: number, field: keyof TimeFrameRow, val: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  return (
    <div>
      <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>Khung giờ áp dụng</label>
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="time" value={row.from} onChange={(e) => update(i, "from", e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }} />
            <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>đến</span>
            <input type="time" value={row.to} onChange={(e) => update(i, "to", e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }} />
            <button onClick={() => remove(i)} type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] text-[var(--cafe-red)] hover:bg-red-50 flex-shrink-0" style={{ fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setRows([...rows, { from: "", to: "" }])} type="button"
        className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12, fontWeight: 500 }}>
        + Thêm khung giờ
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ManagerDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<Discount | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [formValue, setFormValue] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCoupon, setFormCoupon] = useState("");
  const [formMaxUsage, setFormMaxUsage] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string>("");
  const [formImageUrl, setFormImageUrl] = useState<string>("");
  const formImageInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm
  const [deleteDisc, setDeleteDisc] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Conditions dialog
  const [condDisc, setCondDisc] = useState<Discount | null>(null);
  const [condMinOrder, setCondMinOrder] = useState("");
  const [condCustTypes, setCondCustTypes] = useState<string[]>([]);
  const [condProductIds, setCondProductIds] = useState<string[]>([]);
  const [condCategoryIds, setCondCategoryIds] = useState<string[]>([]);
  const [timeFrameRows, setTimeFrameRows] = useState<TimeFrameRow[]>([]);
  const [condSaving, setCondSaving] = useState(false);
  const [condError, setCondError] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Usage history dialog
  const [usageDisc, setUsageDisc] = useState<Discount | null>(null);
  const [usageList, setUsageList] = useState<UsageHistory[]>([]);
  const [usagePage, setUsagePage] = useState(1);
  const [usageTotalPages, setUsageTotalPages] = useState(1);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  useEffect(() => { loadDiscounts(); }, [page, filterStatus]);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const res = await promotionService.getDiscounts({ page, limit: 10, status: filterStatus || undefined });
      const envelope = res as any;
      setDiscounts(envelope?.data ?? []);
      setTotalPages(envelope?.pagination?.totalPages ?? 1);
      setTotal(envelope?.pagination?.total ?? 0);
    } catch {
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  const resetImageForm = () => {
    setFormImageFile(null); setFormImagePreview(""); setFormImageUrl("");
    if (formImageInputRef.current) formImageInputRef.current.value = "";
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Ảnh quá lớn, vui lòng chọn file nhỏ hơn 5MB");
      if (formImageInputRef.current) formImageInputRef.current.value = "";
      return;
    }
    setFormError("");
    setFormImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setFormImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Form ──
  const openCreate = () => {
    setEditingDisc(null);
    setFormName(""); setFormType("PERCENT"); setFormValue(""); setFormDesc("");
    setFormCoupon(""); setFormMaxUsage(""); setFormStart(""); setFormEnd("");
    setFormError(""); resetImageForm(); setFormOpen(true);
  };

  const openEdit = (disc: Discount) => {
    setEditingDisc(disc);
    setFormName(disc.discountName);
    setFormType(disc.discountType);
    setFormValue(String(disc.discountValue));
    setFormDesc(disc.description || "");
    setFormCoupon(disc.couponCode || "");
    setFormMaxUsage(disc.maxUsage != null ? String(disc.maxUsage) : "");
    setFormStart(disc.startDate?.split("T")[0] || "");
    setFormEnd(disc.endDate?.split("T")[0] || "");
    setFormImageFile(null);
    setFormImagePreview(disc.image ? resolveDiscountImageUrl(disc.image) : "");
    setFormImageUrl(disc.image || "");
    setFormError(""); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Vui lòng nhập tên chương trình giảm giá"); return; }
    const val = parseFloat(formValue);
    if (isNaN(val) || val <= 0) { setFormError("Giá trị giảm phải lớn hơn 0"); return; }
    if (formType === "PERCENT" && (val < 1 || val > 100)) { setFormError("Phần trăm giảm phải từ 1 đến 100"); return; }
    if (!formStart) { setFormError("Vui lòng chọn ngày bắt đầu"); return; }
    if (!formEnd) { setFormError("Vui lòng chọn ngày kết thúc"); return; }
    const _td = new Date();
    const _tdStr = `${_td.getFullYear()}-${String(_td.getMonth()+1).padStart(2,'0')}-${String(_td.getDate()).padStart(2,'0')}`;
    if (formStart < _tdStr) { setFormError("Ngày bắt đầu không được là ngày trong quá khứ"); return; }
    if (formEnd < formStart) { setFormError("Ngày kết thúc phải cùng ngày hoặc sau ngày bắt đầu"); return; }
    const maxUsageNum = formMaxUsage ? parseInt(formMaxUsage) : undefined;
    if (formMaxUsage && (!maxUsageNum || maxUsageNum < 1)) { setFormError("Số lần sử dụng tối đa phải lớn hơn 0"); return; }

    try {
      setFormSaving(true); setFormError("");
      let imageUrl = formImageUrl;
      if (formImageFile) {
        imageUrl = await promotionService.uploadDiscountImage(formImageFile);
      }
      if (editingDisc) {
        await promotionService.updateDiscount(editingDisc.discountId, {
          discountName: formName,
          discountType: formType,
          discountValue: val,
          description: formDesc,
          couponCode: formCoupon || undefined,
          maxUsage: maxUsageNum,
          startDate: formStart,
          endDate: formEnd,
          image: imageUrl,
        } as any);
        flash("Cập nhật chương trình giảm giá thành công!");
      } else {
        await promotionService.createDiscount({
          discountName: formName,
          discountType: formType,
          discountValue: val,
          description: formDesc || undefined,
          image: imageUrl || undefined,
          couponCode: formCoupon || undefined,
          maxUsage: maxUsageNum,
          startDate: formStart,
          endDate: formEnd,
        });
        flash("Tạo chương trình giảm giá thành công!");
      }
      setFormOpen(false);
      loadDiscounts();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteDisc) return;
    try {
      setDeleting(true);
      await promotionService.deleteDiscount(deleteDisc.discountId);
      setDeleteDisc(null);
      flash("Đã hủy chương trình giảm giá thành công!");
      loadDiscounts();
    } catch {
      setDeleteDisc(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Conditions ──
  const openConditions = async (disc: Discount) => {
    setCondDisc(disc); setCondError(""); setCondSaving(false);
    // Load sản phẩm và danh mục nếu chưa có
    if (allProducts.length === 0) {
      try { const list = await productService.getProducts(); setAllProducts(list); } catch {}
    }
    if (allCategories.length === 0) {
      try { const list = await productService.getCategories(true); setAllCategories(list); } catch {}
    }
    try {
      const detail = await promotionService.getDiscountById(disc.discountId);
      const cond = (detail as any)?.conditions as DiscountCondition | undefined;
      setCondMinOrder(cond?.minimumOrderAmount != null ? String(cond.minimumOrderAmount) : "");
      setCondCustTypes(cond?.applicableCustomerTypes ?? []);
      setCondProductIds(cond?.applicableProductIds ?? []);
      setCondCategoryIds(cond?.applicableCategoryIds ?? []);
      setTimeFrameRows((cond?.timeFrames ?? []).map((t) => ({ from: t.from ?? "", to: t.to ?? "" })));
    } catch {
      setCondMinOrder(""); setCondCustTypes([]); setCondProductIds([]); setCondCategoryIds([]); setTimeFrameRows([]);
    }
  };

  const toggleCustType = (t: string) =>
    setCondCustTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleCondSave = async () => {
    if (!condDisc) return;
    try {
      setCondSaving(true); setCondError("");
      await promotionService.updateDiscountConditions(condDisc.discountId, {
        minimumOrderAmount: condMinOrder ? parseFloat(condMinOrder) : null,
        applicableCustomerTypes: condCustTypes,
        applicableProductIds: condProductIds,
        applicableCategoryIds: condCategoryIds,
        timeFrames: timeFrameRows.filter((r) => r.from && r.to),
      });
      setCondDisc(null);
      flash("Cập nhật điều kiện thành công!");
    } catch (err: any) {
      setCondError(err.message || "Lỗi khi cập nhật điều kiện");
    } finally {
      setCondSaving(false);
    }
  };

  // ── Usage History ──
  const openUsage = async (disc: Discount) => {
    setUsageDisc(disc); setUsageList([]); setUsagePage(1); setUsageError(""); setUsageLoading(true);
    try {
      const res = await promotionService.getUsageHistory(disc.discountId, { page: 1, limit: 20 }) as any;
      setUsageList(res?.data ?? []);
      setUsageTotalPages(res?.pagination?.totalPages ?? 1);
      setUsageTotal(res?.pagination?.total ?? 0);
    } catch (err: any) {
      setUsageError(err.message || "Không thể tải lịch sử sử dụng");
    } finally {
      setUsageLoading(false);
    }
  };

  const loadMoreUsage = async (p: number) => {
    if (!usageDisc) return;
    setUsageLoading(true);
    try {
      const res = await promotionService.getUsageHistory(usageDisc.discountId, { page: p, limit: 20 }) as any;
      setUsageList(res?.data ?? []);
      setUsagePage(p);
      setUsageTotalPages(res?.pagination?.totalPages ?? 1);
    } catch {} finally { setUsageLoading(false); }
  };

  const formatValue = (disc: Discount) =>
    disc.discountType === "PERCENT" ? `${disc.discountValue}%` : `${disc.discountValue.toLocaleString("vi-VN")}đ`;

  const canEdit = (disc: Discount) => disc.status !== "CANCELLED" && disc.status !== "EXPIRED";
  const canDelete = (disc: Discount) => disc.status === "ACTIVE" || disc.status === "PLANNED";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý giảm giá</h1>
          <p className="font-body text-[var(--cafe-primary)]/50 mt-1" style={{ fontSize: 13 }}>
            Tổng cộng {total} chương trình giảm giá
          </p>
        </div>
        <button onClick={openCreate}
          className="font-body px-5 py-2.5 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ fontSize: 13, fontWeight: 600 }}>
          + Tạo giảm giá
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="PLANNED">Sắp diễn ra</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="EXPIRED">Đã hết hạn</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 14 }}>Không có chương trình giảm giá nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên chương trình", "Loại giảm", "Mức giảm", "Mã coupon", "Đã dùng / Tối đa", "Trạng thái", "Thời gian", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((disc) => (
                <tr key={disc.discountId} className="border-b border-[var(--cafe-bg)] last:border-0 hover:bg-[var(--cafe-bg)]/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{disc.discountName}</p>
                    {disc.description && (
                      <p className="font-body text-[var(--cafe-primary)]/50 mt-0.5 truncate max-w-[180px]" style={{ fontSize: 11 }}>{disc.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={disc.discountType} /></td>
                  <td className="px-4 py-3 font-body text-[var(--cafe-primary)]" style={{ fontSize: 14, fontWeight: 700 }}>
                    {formatValue(disc)}
                  </td>
                  <td className="px-4 py-3">
                    {disc.couponCode ? (
                      <span className="font-body bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200"
                        style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
                        {disc.couponCode}
                      </span>
                    ) : (
                      <span className="font-body text-[var(--cafe-primary)]/30" style={{ fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{disc.usageCount ?? 0}</span>
                    <span className="text-[var(--cafe-primary)]/40"> / </span>
                    <span>{disc.maxUsage != null ? disc.maxUsage : "∞"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={disc.status} /></td>
                  <td className="px-4 py-3 font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>
                    <div>{disc.startDate?.split("T")[0] ?? "—"}</div>
                    <div>→ {disc.endDate?.split("T")[0] ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 min-w-[80px]">
                      {canEdit(disc) && (
                        <button onClick={() => openEdit(disc)}
                          className="font-body text-left text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>
                          Chỉnh sửa
                        </button>
                      )}
                      <button onClick={() => openConditions(disc)}
                        className="font-body text-left text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>
                        Điều kiện
                      </button>
                      <button onClick={() => openUsage(disc)}
                        className="font-body text-left text-blue-600 hover:underline" style={{ fontSize: 12 }}>
                        Lịch sử dùng
                      </button>
                      {canDelete(disc) && (
                        <button onClick={() => setDeleteDisc(disc)}
                          className="font-body text-left text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>
                          Hủy bỏ
                        </button>
                      )}
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
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40" style={{ fontSize: 13 }}>Trước</button>
          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-white disabled:opacity-40" style={{ fontSize: 13 }}>Sau</button>
        </div>
      )}

      {/* ── Create/Edit Dialog ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>
              {editingDisc ? "Chỉnh sửa giảm giá" : "Tạo chương trình giảm giá mới"}
            </h2>
            {editingDisc ? (
              <p className="font-body text-[var(--cafe-primary)]/40 mb-4" style={{ fontSize: 12 }}>
                Mã: <span style={{ fontFamily: "monospace" }}>{editingDisc.discountId}</span>
                {" · "}Lưu ý: không thể thay đổi ngày bắt đầu khi đang hoạt động
              </p>
            ) : (
              <p className="font-body text-[var(--cafe-primary)]/40 mb-4" style={{ fontSize: 12 }}>
                Mã chương trình sẽ được tạo tự động (DISC_XXX)
              </p>
            )}
            {formError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg font-body text-red-600" style={{ fontSize: 13 }}>{formError}</div>
            )}
            <div className="space-y-4">
              {/* Tên */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Tên chương trình <span className="text-red-500">*</span>
                </label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Giảm 20% cuối tuần"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

              {/* Loại + Giá trị */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Loại giảm <span className="text-red-500">*</span>
                  </label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as any)}
                    disabled={!!editingDisc}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] disabled:bg-gray-50 disabled:text-gray-400" style={{ fontSize: 14 }}>
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (đồng)</option>
                  </select>
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Mức giảm {formType === "PERCENT" ? "(%)" : "(đồng)"} <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={formValue} onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formType === "PERCENT" ? "1 – 100" : "VD: 50000"}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Mô tả</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  placeholder="Mô tả ngắn về chương trình giảm giá"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] resize-none" style={{ fontSize: 14 }} />
              </div>

              {/* Ảnh minh họa */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
                  Ảnh minh họa <span className="text-[var(--cafe-primary)]/40" style={{ fontWeight: 400 }}>(tùy chọn)</span>
                </label>
                <input ref={formImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect} className="hidden" />
                {formImagePreview ? (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[var(--cafe-border)] bg-[var(--cafe-bg)]">
                    <img src={formImagePreview} alt="preview" className="w-full h-full object-cover"
                      onError={() => setFormImagePreview("")} />
                    <button type="button" onClick={resetImageForm}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                      style={{ fontSize: 16 }}>×</button>
                    <button type="button" onClick={() => formImageInputRef.current?.click()}
                      className="absolute bottom-2 right-2 font-body px-3 py-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      style={{ fontSize: 12 }}>Đổi ảnh</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => formImageInputRef.current?.click()}
                    className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-[var(--cafe-border)] hover:border-[var(--cafe-gold)] transition-colors flex flex-col items-center justify-center gap-2 bg-[var(--cafe-bg)]/50">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ color: "var(--cafe-primary)", opacity: 0.3 }}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm5.25-4.5h.008v.008h-.008V7.5zM6.75 19.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 13 }}>Nhấn để chọn ảnh</span>
                    <span className="font-body text-[var(--cafe-primary)]/25" style={{ fontSize: 11 }}>JPEG, PNG, WebP, GIF — tối đa 5MB</span>
                  </button>
                )}
              </div>

              {/* Mã coupon */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Mã coupon <span className="text-[var(--cafe-primary)]/40" style={{ fontWeight: 400 }}>(tùy chọn)</span>
                </label>
                <input value={formCoupon} onChange={(e) => setFormCoupon(e.target.value.toUpperCase())}
                  placeholder="VD: WEEKEND20 — để trống nếu không cần coupon"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14, fontFamily: formCoupon ? "monospace" : "inherit" }} />
              </div>

              {/* Số lần tối đa */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Số lần sử dụng tối đa <span className="text-[var(--cafe-primary)]/40" style={{ fontWeight: 400 }}>(để trống = không giới hạn)</span>
                </label>
                <input type="number" min="1" value={formMaxUsage} onChange={(e) => setFormMaxUsage(e.target.value)}
                  placeholder="VD: 200"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

              {/* Ngày */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                    disabled={!!editingDisc && editingDisc.status === "ACTIVE"}
                    min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] disabled:bg-gray-50 disabled:text-gray-400" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}
                    min={formStart || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setFormOpen(false)}
                className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={formSaving}
                className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 600 }}>
                {formSaving ? "Đang lưu..." : editingDisc ? "Cập nhật" : "Tạo chương trình"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Dialog ── */}
      {deleteDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteDisc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Hủy chương trình giảm giá</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-2" style={{ fontSize: 14 }}>
              Bạn có chắc muốn hủy chương trình <strong>{deleteDisc.discountName}</strong>?
            </p>
            <p className="font-body text-[var(--cafe-primary)]/40 mb-6" style={{ fontSize: 12 }}>
              Chương trình sẽ được đánh dấu là đã hủy và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDisc(null)}
                className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
                Không hủy
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-xl hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 600 }}>
                {deleting ? "Đang hủy..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conditions Dialog ── */}
      {condDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCondDisc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Điều kiện áp dụng</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>{condDisc.discountName}</p>

            {condError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg font-body text-red-600" style={{ fontSize: 13 }}>{condError}</div>
            )}

            <div className="space-y-5">
              {/* Giá trị đơn tối thiểu */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Giá trị đơn hàng tối thiểu (đồng)
                </label>
                <input type="number" value={condMinOrder} onChange={(e) => setCondMinOrder(e.target.value)}
                  placeholder="Để trống nếu không có yêu cầu"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Loại khách */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
                  Loại khách hàng được áp dụng
                </label>
                <div className="flex gap-6">
                  {["REGULAR", "VIP"].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={condCustTypes.includes(t)} onChange={() => toggleCustType(t)}
                        className="w-4 h-4 accent-[var(--cafe-gold)]" />
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>
                        {t === "REGULAR" ? "Khách thường" : "Khách VIP"}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="font-body text-[var(--cafe-primary)]/40 mt-1" style={{ fontSize: 11 }}>
                  Không chọn = áp dụng cho tất cả loại khách hàng
                </p>
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Sản phẩm áp dụng — multi-select */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Sản phẩm áp dụng
                </label>
                <div className="border border-[var(--cafe-border)] rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  {allProducts.length === 0 ? (
                    <p className="font-body text-[var(--cafe-primary)]/40 px-3 py-2" style={{ fontSize: 12 }}>Đang tải sản phẩm...</p>
                  ) : (
                    allProducts.map((p) => {
                      const checked = condProductIds.includes(p._id);
                      return (
                        <label key={p._id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--cafe-bg)] transition-colors ${checked ? "bg-amber-50" : ""}`}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setCondProductIds((prev) => checked ? prev.filter((id) => id !== p._id) : [...prev, p._id])}
                            className="w-4 h-4 accent-[var(--cafe-gold)] flex-shrink-0" />
                          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{p.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="font-body text-[var(--cafe-primary)]/40 mt-1" style={{ fontSize: 11 }}>
                  Không chọn = áp dụng tất cả sản phẩm · Đã chọn: {condProductIds.length}
                </p>
              </div>

              {/* Danh mục áp dụng — multi-select */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Danh mục áp dụng
                </label>
                <div className="border border-[var(--cafe-border)] rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                  {allCategories.length === 0 ? (
                    <p className="font-body text-[var(--cafe-primary)]/40 px-3 py-2" style={{ fontSize: 12 }}>Đang tải danh mục...</p>
                  ) : (
                    allCategories.map((cat) => {
                      const checked = condCategoryIds.includes(cat.categoryId);
                      return (
                        <label key={cat.categoryId} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--cafe-bg)] transition-colors ${checked ? "bg-amber-50" : ""}`}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setCondCategoryIds((prev) => checked ? prev.filter((id) => id !== cat.categoryId) : [...prev, cat.categoryId])}
                            className="w-4 h-4 accent-[var(--cafe-gold)] flex-shrink-0" />
                          <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>{cat.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="font-body text-[var(--cafe-primary)]/40 mt-1" style={{ fontSize: 11 }}>
                  Không chọn = áp dụng tất cả danh mục · Đã chọn: {condCategoryIds.length}
                </p>
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Khung giờ */}
              <TimeFrameRows rows={timeFrameRows} setRows={setTimeFrameRows} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCondDisc(null)}
                className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
                Đóng
              </button>
              <button onClick={handleCondSave} disabled={condSaving}
                className="font-body flex-1 py-2.5 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 600 }}>
                {condSaving ? "Đang lưu..." : "Lưu điều kiện"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Usage History Dialog ── */}
      {usageDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setUsageDisc(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Lịch sử sử dụng</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>
              {usageDisc.discountName} · Tổng {usageTotal} lượt sử dụng
            </p>

            {usageError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg font-body text-red-600" style={{ fontSize: 13 }}>{usageError}</div>
            )}

            {usageLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : usageList.length === 0 ? (
              <p className="font-body text-center text-[var(--cafe-primary)]/40 py-8" style={{ fontSize: 14 }}>Chưa có lượt sử dụng nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-[var(--cafe-bg)]">
                      {["Mã đơn hàng", "Khách hàng", "Giá gốc", "Giảm giá", "Thực trả", "Thời gian"].map((h) => (
                        <th key={h} className="font-body text-left px-3 py-2 text-[var(--cafe-primary)]/60" style={{ fontSize: 11, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usageList.map((u) => (
                      <tr key={u._id} className="border-b border-[var(--cafe-bg)] last:border-0">
                        <td className="px-3 py-2 font-body text-[var(--cafe-primary)]" style={{ fontSize: 12, fontFamily: "monospace" }}>{u.orderId}</td>
                        <td className="px-3 py-2 font-body text-[var(--cafe-primary)]/70" style={{ fontSize: 12 }}>{u.customerId ?? "—"}</td>
                        <td className="px-3 py-2 font-body text-[var(--cafe-primary)]" style={{ fontSize: 12 }}>{u.originalAmount.toLocaleString("vi-VN")}đ</td>
                        <td className="px-3 py-2 font-body text-green-600" style={{ fontSize: 12, fontWeight: 600 }}>
                          {u.discountAmount > 0 ? `-${u.discountAmount.toLocaleString("vi-VN")}đ` : "—"}
                        </td>
                        <td className="px-3 py-2 font-body text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 600 }}>{u.finalAmount.toLocaleString("vi-VN")}đ</td>
                        <td className="px-3 py-2 font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>
                          {new Date(u.usedAt).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {usageTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => loadMoreUsage(Math.max(1, usagePage - 1))} disabled={usagePage <= 1 || usageLoading}
                  className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] disabled:opacity-40" style={{ fontSize: 12 }}>Trước</button>
                <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 12 }}>{usagePage} / {usageTotalPages}</span>
                <button onClick={() => loadMoreUsage(Math.min(usageTotalPages, usagePage + 1))} disabled={usagePage >= usageTotalPages || usageLoading}
                  className="font-body px-3 py-1.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)] disabled:opacity-40" style={{ fontSize: 12 }}>Sau</button>
              </div>
            )}

            <button onClick={() => setUsageDisc(null)}
              className="font-body w-full mt-5 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
