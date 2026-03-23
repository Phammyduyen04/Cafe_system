import { useEffect, useState } from "react";
import { promotionService, type Promotion } from "../../../services/promotion.service";
import { productService, type Product } from "../../../services/product.service";

type ProductRow = { productId: string; quantity: string };

function ProductSelectRows({
  label,
  rows,
  setRows,
  products,
}: {
  label: string;
  rows: ProductRow[];
  setRows: (rows: ProductRow[]) => void;
  products: Product[];
}) {
  const updateQty = (i: number, val: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, quantity: val } : r)));
  const updateProduct = (i: number, val: string) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, productId: val } : r)));
  const remove = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const add = () => setRows([...rows, { productId: "", quantity: "1" }]);

  return (
    <div>
      <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
        {label}
      </label>
      <div className="space-y-2 mb-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={row.productId}
              onChange={(e) => updateProduct(i, e.target.value)}
              className="font-body flex-1 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] bg-white"
              style={{ fontSize: 13 }}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={row.quantity}
              onChange={(e) => updateQty(i, e.target.value)}
              placeholder="SL"
              className="font-body w-16 px-3 py-2 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] text-center"
              style={{ fontSize: 13 }}
            />
            <button
              onClick={() => remove(i)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--cafe-border)] text-[var(--cafe-red)] hover:bg-red-50 transition-colors flex-shrink-0"
              style={{ fontSize: 16 }}
              type="button"
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
        + Thêm sản phẩm
      </button>
    </div>
  );
}

export default function ManagerPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Create/Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [formName, setFormName] = useState("");
  const [formBenefit, setFormBenefit] = useState("BUY_X_GET_Y");
  const [formDesc, setFormDesc] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm
  const [deletePromo, setDeletePromo] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Conditions dialog
  const [condPromo, setCondPromo] = useState<Promotion | null>(null);
  const [triggerRows, setTriggerRows] = useState<ProductRow[]>([]);
  const [rewardRows, setRewardRows] = useState<ProductRow[]>([]);
  const [condMinOrder, setCondMinOrder] = useState("");
  const [condCustRegular, setCondCustRegular] = useState(false);
  const [condCustVip, setCondCustVip] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [condSaving, setCondSaving] = useState(false);
  const [condError, setCondError] = useState("");

  useEffect(() => {
    loadPromotions();
  }, [page, filterStatus]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const res = await promotionService.getPromotions({
        page, limit: 10,
        status: filterStatus || undefined,
      });
      const data = res as any;
      setPromotions(Array.isArray(data) ? data : data?.data ?? data?.promotions ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setEditingStatus("");
    setFormName("");
    setFormBenefit("BUY_X_GET_Y");
    setFormDesc("");
    setFormStart("");
    setFormEnd("");
    setError("");
    setFormOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingId(promo.promotionId);
    setEditingStatus(promo.status);
    setFormName(promo.promotionName);
    setFormBenefit(promo.benefitType);
    setFormDesc(promo.description || "");
    setFormStart(promo.startDate?.split("T")[0] || "");
    setFormEnd(promo.endDate?.split("T")[0] || "");
    setError("");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setError("Nhập tên khuyến mãi"); return; }
    if (!formStart || !formEnd) { setError("Ngày bắt đầu và kết thúc là bắt buộc"); return; }
    try {
      setFormSaving(true);
      setError("");
      if (editingId) {
        await promotionService.updatePromotion(editingId, {
          promotionName: formName,
          benefitType: formBenefit,
          description: formDesc,
          startDate: formStart || null,
          endDate: formEnd || null,
        });
        setSuccessMsg("Cập nhật khuyến mãi thành công!");
      } else {
        await promotionService.createPromotion({
          promotionName: formName,
          benefitType: formBenefit,
          description: formDesc || undefined,
          startDate: formStart || undefined,
          endDate: formEnd || undefined,
        });
        setSuccessMsg("Tạo khuyến mãi thành công!");
      }
      setFormOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
      loadPromotions();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePromo) return;
    try {
      setDeleting(true);
      await promotionService.deletePromotion(deletePromo.promotionId);
      setDeletePromo(null);
      setSuccessMsg("Đã xóa khuyến mãi!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadPromotions();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa");
    } finally {
      setDeleting(false);
    }
  };

  const openConditions = async (promo: Promotion) => {
    setCondPromo(promo);
    setCondSaving(false);
    setCondError("");
    try {
      const [detail, prods] = await Promise.all([
        promotionService.getPromotionById(promo.promotionId),
        productService.getProducts(),
      ]);
      setAvailableProducts(prods);
      const cond = (detail as any)?.conditions;
      setTriggerRows(
        cond?.triggerProducts?.map((p: any) => ({ productId: p.productId, quantity: String(p.quantity) })) ?? []
      );
      setRewardRows(
        cond?.rewardProducts?.map((p: any) => ({ productId: p.productId, quantity: String(p.quantity) })) ?? []
      );
      setCondMinOrder(cond?.minimumOrderAmount != null ? String(cond.minimumOrderAmount) : "");
      const types: string[] = cond?.applicableCustomerTypes ?? [];
      setCondCustRegular(types.includes("REGULAR"));
      setCondCustVip(types.includes("VIP"));
    } catch {
      setTriggerRows([]);
      setRewardRows([]);
      setCondMinOrder("");
      setCondCustRegular(false);
      setCondCustVip(false);
    }
  };

  const handleCondSave = async () => {
    if (!condPromo) return;
    try {
      setCondSaving(true);
      setCondError("");
      const triggerProducts = triggerRows
        .filter((r) => r.productId.trim())
        .map((r) => ({ productId: r.productId.trim(), quantity: parseInt(r.quantity) || 1 }));
      const rewardProducts = rewardRows
        .filter((r) => r.productId.trim())
        .map((r) => ({ productId: r.productId.trim(), quantity: parseInt(r.quantity) || 1 }));
      await promotionService.updatePromotionConditions(condPromo.promotionId, {
        triggerProducts,
        rewardProducts,
        minimumOrderAmount: condMinOrder ? parseFloat(condMinOrder) : null,
        applicableCustomerTypes: [
          ...(condCustRegular ? ["REGULAR"] : []),
          ...(condCustVip ? ["VIP"] : []),
        ],
      });
      setCondPromo(null);
      setSuccessMsg("Cập nhật điều kiện thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setCondError(err.message || "Lỗi khi cập nhật điều kiện");
    } finally {
      setCondSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      ACTIVE:    { bg: "#dcfce7", color: "#16a34a" },
      PLANNED:   { bg: "#dbeafe", color: "#2563eb" },
      EXPIRED:   { bg: "#f3f4f6", color: "#6b7280" },
      CANCELLED: { bg: "#fef2f2", color: "#dc2626" },
    };
    const s = styles[status] ?? { bg: "#f3f4f6", color: "#6b7280" };
    return (
      <span className="font-body inline-block px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 28, fontWeight: 700 }}>Quản lý khuyến mãi</h1>
        <button onClick={openCreate} className="font-body px-4 py-2.5 bg-[var(--cafe-primary)] text-white rounded-lg hover:opacity-90 transition-opacity" style={{ fontSize: 13, fontWeight: 500 }}>
          + Tạo khuyến mãi
        </button>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-body text-sm">{successMsg}</div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="font-body px-4 py-2 border border-[var(--cafe-border)] rounded-lg bg-white focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 13 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="PLANNED">PLANNED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXPIRED">EXPIRED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[var(--cafe-border)] text-center">
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 14 }}>Không có khuyến mãi nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--cafe-bg)]">
                {["Mã", "Tên", "Loại", "Trạng thái", "Bắt đầu", "Kết thúc", "Hành động"].map((h) => (
                  <th key={h} className="font-body text-left px-4 py-3 text-[var(--cafe-primary)]/60" style={{ fontSize: 12, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.promotionId} className="border-b border-[var(--cafe-bg)] last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-body text-[var(--cafe-primary)]/50 bg-[var(--cafe-bg)] px-2 py-0.5 rounded" style={{ fontSize: 11, fontFamily: "monospace" }}>
                      {promo.promotionId}
                    </span>
                  </td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{promo.promotionName}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 13 }}>{promo.benefitType}</td>
                  <td className="px-4 py-3">{statusBadge(promo.status)}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 12 }}>{promo.startDate?.split("T")[0] || "—"}</td>
                  <td className="font-body px-4 py-3 text-[var(--cafe-primary)]/70" style={{ fontSize: 12 }}>{promo.endDate?.split("T")[0] || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(promo)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      <button onClick={() => setDeletePromo(promo)} className="font-body text-[var(--cafe-red)] hover:underline" style={{ fontSize: 12 }}>Xóa</button>
                      <button onClick={() => openConditions(promo)} className="font-body text-[var(--cafe-primary)] hover:underline" style={{ fontSize: 12 }}>Điều kiện</button>
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
              {editingId ? "Sửa khuyến mãi" : "Tạo khuyến mãi"}
            </h2>
            {error && <p className="font-body text-[var(--cafe-red)] mb-3 text-sm">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Tên khuyến mãi</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Loại ưu đãi</label>
                <select value={formBenefit} onChange={(e) => setFormBenefit(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }}>
                  <option value="BUY_X_GET_Y">BUY_X_GET_Y</option>
                  <option value="FREE_ITEM">FREE_ITEM</option>
                  <option value="COMBO">COMBO</option>
                </select>
              </div>
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Mô tả</label>
                <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)]" style={{ fontSize: 14 }} />
              </div>
              {editingStatus === "ACTIVE" && (
                <p className="font-body text-amber-600 text-xs">Không thể sửa ngày khi khuyến mãi đang ACTIVE.</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Bắt đầu</label>
                  <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} disabled={editingStatus === "ACTIVE"} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <label className="font-body text-[var(--cafe-primary)] block mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Kết thúc</label>
                  <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} disabled={editingStatus === "ACTIVE"} className="font-body w-full px-4 py-2.5 border border-[var(--cafe-border)] rounded-lg focus:outline-none focus:border-[var(--cafe-gold)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontSize: 14 }} />
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
      {deletePromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeletePromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-red)] mb-2" style={{ fontSize: 20, fontWeight: 600 }}>Xóa khuyến mãi</h2>
            <p className="font-body text-[var(--cafe-primary)]/70 mb-6" style={{ fontSize: 14 }}>
              Bạn có chắc muốn xóa <strong>{deletePromo.promotionName}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletePromo(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
              <button onClick={handleDelete} disabled={deleting} className="font-body flex-1 py-2.5 bg-[var(--cafe-red)] text-white rounded-lg hover:opacity-90 disabled:opacity-50" style={{ fontSize: 14, fontWeight: 500 }}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conditions Dialog */}
      {condPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCondPromo(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-[var(--cafe-primary)] mb-1" style={{ fontSize: 22, fontWeight: 600 }}>Điều kiện khuyến mãi</h2>
            <p className="font-body text-[var(--cafe-primary)]/60 mb-5" style={{ fontSize: 13 }}>{condPromo.promotionName}</p>

            {condError && (
              <p className="font-body text-[var(--cafe-red)] mb-4 text-sm">{condError}</p>
            )}

            <div className="space-y-6">
              <ProductSelectRows label="Sản phẩm kích hoạt" rows={triggerRows} setRows={setTriggerRows} products={availableProducts} />

              <div className="border-t border-[var(--cafe-bg)]" />

              <ProductSelectRows label="Sản phẩm thưởng" rows={rewardRows} setRows={setRewardRows} products={availableProducts} />

              <div className="border-t border-[var(--cafe-bg)]" />

              {/* Customer types */}
              <div>
                <label className="font-body text-[var(--cafe-primary)] block mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
                  Loại khách hàng áp dụng
                </label>
                <div className="flex gap-6">
                  {[
                    { key: "regular", label: "REGULAR", checked: condCustRegular, set: setCondCustRegular },
                    { key: "vip", label: "VIP", checked: condCustVip, set: setCondCustVip },
                  ].map(({ key, label, checked, set }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="w-4 h-4 accent-[var(--cafe-gold)]" />
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                    </label>
                  ))}
                </div>
                <p className="font-body text-[var(--cafe-primary)]/40 mt-1" style={{ fontSize: 11 }}>Không chọn = áp dụng tất cả loại KH</p>
              </div>

              <div className="border-t border-[var(--cafe-bg)]" />

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
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCondPromo(null)} className="font-body flex-1 py-2.5 border border-[var(--cafe-border)] rounded-lg hover:bg-[var(--cafe-bg)]" style={{ fontSize: 14, fontWeight: 500 }}>Hủy</button>
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
