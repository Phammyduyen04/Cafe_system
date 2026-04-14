import { useEffect, useRef, useState } from "react";
import { promotionService, type Promotion, type PromotionCondition, type UsageHistory } from "../../../services/promotion.service";
import { productService, type Product } from "../../../services/product.service";

// ── Helpers ────────────────────────────────────────────────────────────────
type ProductRow = { productId: string; quantity: string };

function ProductRowsDropdown({
  label,
  rows,
  setRows,
  products,
}: {
  label: string;
  rows: ProductRow[];
  setRows: (r: ProductRow[]) => void;
  products: Product[];
}) {
  const update = (i: number, field: keyof ProductRow, val: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const selectedIds = rows.map((r) => r.productId);

  return (
    <div>
      <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={row.productId}
              onChange={(e) => update(i, "productId", e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] bg-white"
              style={{ fontSize: 13 }}
            >
              <option value="">— Chọn sản phẩm —</option>
              {products.map((p) => (
                <option key={p._id} value={p._id} disabled={selectedIds.includes(p._id) && row.productId !== p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number" min="1" value={row.quantity}
              onChange={(e) => update(i, "quantity", e.target.value)}
              placeholder="Số lượng"
              className="font-body w-24 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-center"
              style={{ fontSize: 13 }}
            />
            <button onClick={() => remove(i)} type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] text-[var(--cafe-red)] hover:bg-red-50 flex-shrink-0"
              style={{ fontSize: 16 }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => setRows([...rows, { productId: "", quantity: "1" }])} type="button"
        className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12, fontWeight: 500 }}>
        + Thêm sản phẩm
      </button>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const resolvePromotionImageUrl = (url: string) =>
  url?.startsWith("/uploads/") ? `${API_BASE}${url}` : url;

const BENEFIT_LABELS: Record<string, string> = {
  BUY_X_GET_Y: "Mua X tặng Y",
  FREE_ITEM: "Tặng sản phẩm",
  GIFT_WITH_ORDER: "Quà kèm đơn hàng",
};

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

// ── Main Component ─────────────────────────────────────────────────────────
export default function ManagerPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formName, setFormName] = useState("");
  const [formBenefit, setFormBenefit] = useState<"BUY_X_GET_Y" | "FREE_ITEM" | "GIFT_WITH_ORDER">("BUY_X_GET_Y");
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
  const [deletePromo, setDeletePromo] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Conditions dialog
  const [condPromo, setCondPromo] = useState<Promotion | null>(null);
  const [triggerRows, setTriggerRows] = useState<ProductRow[]>([]);
  const [rewardRows, setRewardRows] = useState<ProductRow[]>([]);
  const [condMinOrder, setCondMinOrder] = useState("");
  const [condCustTypes, setCondCustTypes] = useState<string[]>([]);
  const [condSaving, setCondSaving] = useState(false);
  const [condError, setCondError] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Usage history dialog
  const [usagePromo, setUsagePromo] = useState<Promotion | null>(null);
  const [usageList, setUsageList] = useState<UsageHistory[]>([]);
  const [usagePage, setUsagePage] = useState(1);
  const [usageTotalPages, setUsageTotalPages] = useState(1);
  const [usageTotal, setUsageTotal] = useState(0);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState("");

  useEffect(() => { loadPromotions(); }, [page, filterStatus]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const res = await promotionService.getPromotions({ page, limit: 10, status: filterStatus || undefined });
      const envelope = res as any;
      setPromotions(envelope?.data ?? []);
      setTotalPages(envelope?.pagination?.totalPages ?? 1);
      setTotal(envelope?.pagination?.total ?? 0);
    } catch {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3000); };

  // ── Form ──
  const resetImageForm = () => {
    setFormImageFile(null);
    setFormImagePreview("");
    setFormImageUrl("");
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

  const openCreate = () => {
    setEditingPromo(null);
    setFormName(""); setFormBenefit("BUY_X_GET_Y"); setFormDesc("");
    setFormCoupon(""); setFormMaxUsage(""); setFormStart(""); setFormEnd("");
    setFormError(""); resetImageForm(); setFormOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormName(promo.promotionName);
    setFormBenefit(promo.benefitType);
    setFormDesc(promo.description || "");
    setFormCoupon(promo.couponCode || "");
    setFormMaxUsage(promo.maxUsage != null ? String(promo.maxUsage) : "");
    setFormStart(promo.startDate?.split("T")[0] || "");
    setFormEnd(promo.endDate?.split("T")[0] || "");
    setFormImageFile(null);
    setFormImagePreview(promo.image ? resolvePromotionImageUrl(promo.image) : "");
    setFormImageUrl(promo.image || "");
    setFormError(""); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setFormError("Vui lòng nhập tên chương trình khuyến mãi"); return; }
    if (!formStart) { setFormError("Vui lòng chọn ngày bắt đầu"); return; }
    if (!formEnd) { setFormError("Vui lòng chọn ngày kết thúc"); return; }
    const maxUsageNum = formMaxUsage ? parseInt(formMaxUsage) : undefined;
    if (formMaxUsage && (!maxUsageNum || maxUsageNum < 1)) { setFormError("Số lần sử dụng tối đa phải lớn hơn 0"); return; }
    try {
      setFormSaving(true); setFormError("");
      // Upload ảnh mới nếu có chọn file
      let imageUrl = formImageUrl;
      if (formImageFile) {
        imageUrl = await promotionService.uploadPromotionImage(formImageFile);
      }
      if (editingPromo) {
        await promotionService.updatePromotion(editingPromo.promotionId, {
          promotionName: formName,
          description: formDesc,
          couponCode: formCoupon || undefined,
          maxUsage: maxUsageNum,
          endDate: formEnd,
          image: imageUrl,
        } as any);
        flash("Cập nhật chương trình khuyến mãi thành công!");
      } else {
        await promotionService.createPromotion({
          promotionName: formName,
          benefitType: formBenefit,
          description: formDesc || undefined,
          image: imageUrl || undefined,
          couponCode: formCoupon || undefined,
          maxUsage: maxUsageNum,
          startDate: formStart,
          endDate: formEnd,
        });
        flash("Tạo chương trình khuyến mãi thành công!");
      }
      setFormOpen(false);
      loadPromotions();
    } catch (err: any) {
      setFormError(err.message || "Có lỗi xảy ra khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deletePromo) return;
    try {
      setDeleting(true);
      await promotionService.deletePromotion(deletePromo.promotionId);
      setDeletePromo(null);
      flash("Đã hủy chương trình khuyến mãi thành công!");
      loadPromotions();
    } catch (err: any) {
      setDeletePromo(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Conditions ──
  const openConditions = async (promo: Promotion) => {
    setCondPromo(promo); setCondError(""); setCondSaving(false);
    // Load danh sách sản phẩm nếu chưa có
    if (allProducts.length === 0) {
      try { const list = await productService.getProducts(); setAllProducts(list); } catch {}
    }
    try {
      const detail = await promotionService.getPromotionById(promo.promotionId);
      const cond = (detail as any)?.conditions as PromotionCondition | undefined;
      setTriggerRows(cond?.triggerProducts?.map((p) => ({ productId: p.productId, quantity: String(p.quantity) })) ?? []);
      setRewardRows(cond?.rewardProducts?.map((p) => ({ productId: p.productId, quantity: String(p.quantity) })) ?? []);
      setCondMinOrder(cond?.minimumOrderAmount != null ? String(cond.minimumOrderAmount) : "");
      setCondCustTypes(cond?.applicableCustomerTypes ?? []);
    } catch {
      setTriggerRows([]); setRewardRows([]); setCondMinOrder(""); setCondCustTypes([]);
    }
  };

  const toggleCustType = (t: string) =>
    setCondCustTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleCondSave = async () => {
    if (!condPromo) return;
    try {
      setCondSaving(true); setCondError("");
      await promotionService.updatePromotionConditions(condPromo.promotionId, {
        triggerProducts: triggerRows.filter((r) => r.productId.trim())
          .map((r) => ({ productId: r.productId.trim(), quantity: parseInt(r.quantity) || 1 })),
        rewardProducts: rewardRows.filter((r) => r.productId.trim())
          .map((r) => ({ productId: r.productId.trim(), quantity: parseInt(r.quantity) || 1 })),
        minimumOrderAmount: condMinOrder ? parseFloat(condMinOrder) : null,
        applicableCustomerTypes: condCustTypes,
      });
      setCondPromo(null);
      flash("Cập nhật điều kiện thành công!");
    } catch (err: any) {
      setCondError(err.message || "Lỗi khi cập nhật điều kiện");
    } finally {
      setCondSaving(false);
    }
  };

  // ── Usage History ──
  const openUsage = async (promo: Promotion) => {
    setUsagePromo(promo); setUsageList([]); setUsagePage(1); setUsageError(""); setUsageLoading(true);
    try {
      const res = await promotionService.getUsageHistory(promo.promotionId, { page: 1, limit: 20 }) as any;
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
    if (!usagePromo) return;
    setUsageLoading(true);
    try {
      const res = await promotionService.getUsageHistory(usagePromo.promotionId, { page: p, limit: 20 }) as any;
      setUsageList(res?.data ?? []);
      setUsagePage(p);
      setUsageTotalPages(res?.pagination?.totalPages ?? 1);
    } catch {} finally { setUsageLoading(false); }
  };

  const canEdit = (promo: Promotion) => promo.status !== "CANCELLED" && promo.status !== "EXPIRED";
  const canDelete = (promo: Promotion) => promo.status === "ACTIVE" || promo.status === "PLANNED";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý khuyến mãi</h1>
          <p className="font-body text-[var(--cafe-primary)]/50 mt-1" style={{ fontSize: 13 }}>
            Tổng cộng {total} chương trình khuyến mãi
          </p>
        </div>
        <button onClick={openCreate}
          className="font-body px-5 py-2.5 bg-[var(--cafe-primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
          style={{ fontSize: 13, fontWeight: 600 }}>
          + Tạo khuyến mãi
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
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 14 }}>Không có chương trình khuyến mãi nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Tên chương trình", "Loại ưu đãi", "Mã coupon", "Đã dùng / Tối đa", "Trạng thái", "Thời gian", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.promotionId} className="border-b border-[var(--cafe-bg)] last:border-0 hover:bg-[var(--cafe-bg)]/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{promo.promotionName}</p>
                    {promo.description && (
                      <p className="font-body text-[var(--cafe-primary)]/50 mt-0.5 truncate max-w-[200px]" style={{ fontSize: 11 }}>{promo.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-body inline-block px-2 py-0.5 rounded-full bg-purple-50 text-purple-700"
                      style={{ fontSize: 11, fontWeight: 600 }}>
                      {BENEFIT_LABELS[promo.benefitType] ?? promo.benefitType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {promo.couponCode ? (
                      <span className="font-body bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200"
                        style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>
                        {promo.couponCode}
                      </span>
                    ) : (
                      <span className="font-body text-[var(--cafe-primary)]/30" style={{ fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-body text-[var(--cafe-primary)]" style={{ fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{promo.usageCount ?? 0}</span>
                    <span className="text-[var(--cafe-primary)]/40"> / </span>
                    <span>{promo.maxUsage != null ? promo.maxUsage : "∞"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={promo.status} /></td>
                  <td className="px-4 py-3 font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 11 }}>
                    <div>{promo.startDate?.split("T")[0] ?? "—"}</div>
                    <div>→ {promo.endDate?.split("T")[0] ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5 min-w-[80px]">
                      {canEdit(promo) && (
                        <button onClick={() => openEdit(promo)}
                          className="font-body text-left text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>
                          Chỉnh sửa
                        </button>
                      )}
                      <button onClick={() => openConditions(promo)}
                        className="font-body text-left text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>
                        Điều kiện
                      </button>
                      <button onClick={() => openUsage(promo)}
                        className="font-body text-left text-blue-600 hover:underline" style={{ fontSize: 12 }}>
                        Lịch sử dùng
                      </button>
                      {canDelete(promo) && (
                        <button onClick={() => setDeletePromo(promo)}
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
              {editingPromo ? "Chỉnh sửa khuyến mãi" : "Tạo chương trình khuyến mãi mới"}
            </h2>
            {editingPromo && (
              <p className="font-body text-[var(--cafe-primary)]/40 mb-4" style={{ fontSize: 12 }}>
                Mã: <span style={{ fontFamily: "monospace" }}>{editingPromo.promotionId}</span>
                {" · "}Lưu ý: không thể thay đổi loại ưu đãi hoặc ngày bắt đầu khi đang hoạt động
              </p>
            )}
            {!editingPromo && (
              <p className="font-body text-[var(--cafe-primary)]/40 mb-4" style={{ fontSize: 12 }}>
                
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
                  placeholder="VD: Mua 2 tặng 1 Espresso"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

              {/* Loại ưu đãi — chỉ hiện khi tạo mới */}
              {!editingPromo && (
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Loại ưu đãi <span className="text-red-500">*</span>
                  </label>
                  <select value={formBenefit} onChange={(e) => setFormBenefit(e.target.value as any)}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }}>
                    <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                    <option value="FREE_ITEM">Tặng sản phẩm</option>
                    <option value="GIFT_WITH_ORDER">Quà kèm đơn hàng</option>
                  </select>
                </div>
              )}

              {/* Mô tả */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Mô tả</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2}
                  placeholder="Mô tả ngắn về chương trình khuyến mãi"
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
                    <button type="button"
                      onClick={() => { resetImageForm(); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                      style={{ fontSize: 16 }}>×</button>
                    <button type="button"
                      onClick={() => formImageInputRef.current?.click()}
                      className="absolute bottom-2 right-2 font-body px-3 py-1 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      style={{ fontSize: 12 }}>Đổi ảnh</button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => formImageInputRef.current?.click()}
                    className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-[var(--cafe-border)] hover:border-[var(--cafe-gold)] transition-colors flex flex-col items-center justify-center gap-2 bg-[var(--cafe-bg)]/50">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      className="text-[var(--cafe-primary)]/30" style={{ color: "var(--cafe-primary)", opacity: 0.3 }}>
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
                  placeholder="VD: SUMMER2026 — để trống nếu không cần coupon"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]"
                  style={{ fontSize: 14, fontFamily: formCoupon ? "monospace" : "inherit" }} />
              </div>

              {/* Số lần sử dụng tối đa */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Số lần sử dụng tối đa <span className="text-[var(--cafe-primary)]/40" style={{ fontWeight: 400 }}>(để trống = không giới hạn)</span>
                </label>
                <input type="number" min="1" value={formMaxUsage} onChange={(e) => setFormMaxUsage(e.target.value)}
                  placeholder="VD: 100"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

              {/* Ngày */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                    disabled={!!editingPromo && editingPromo.status === "ACTIVE"}
                    className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] disabled:bg-gray-50 disabled:text-gray-400" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}
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
                {formSaving ? "Đang lưu..." : editingPromo ? "Cập nhật" : "Tạo chương trình"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Dialog ── */}
      {deletePromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeletePromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Hủy chương trình khuyến mãi</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-2" style={{ fontSize: 14 }}>
              Bạn có chắc muốn hủy chương trình <strong>{deletePromo.promotionName}</strong>?
            </p>
            <p className="font-body text-[var(--cafe-primary)]/40 mb-6" style={{ fontSize: 12 }}>
              Chương trình sẽ được đánh dấu là đã hủy và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletePromo(null)}
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
      {condPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCondPromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Điều kiện áp dụng</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>{condPromo.promotionName}</p>

            {condError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg font-body text-red-600" style={{ fontSize: 13 }}>{condError}</div>
            )}

            <div className="space-y-6">
              <ProductRowsDropdown label="Sản phẩm kích hoạt khuyến mãi" rows={triggerRows} setRows={setTriggerRows} products={allProducts} />

              <div className="border-t border-[var(--cafe-bg)]" />

              <ProductRowsDropdown label="Sản phẩm tặng kèm" rows={rewardRows} setRows={setRewardRows} products={allProducts} />

              <div className="border-t border-[var(--cafe-bg)]" />

              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                  Giá trị đơn hàng tối thiểu (đồng)
                </label>
                <input type="number" value={condMinOrder} onChange={(e) => setCondMinOrder(e.target.value)}
                  placeholder="Để trống nếu không có yêu cầu"
                  className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>

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
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCondPromo(null)}
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
      {usagePromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setUsagePromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Lịch sử sử dụng</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>
              {usagePromo.promotionName} · Tổng {usageTotal} lượt sử dụng
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

            <button onClick={() => setUsagePromo(null)}
              className="font-body w-full mt-5 py-2.5 border border-[var(--cafe-border)] rounded-xl hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
