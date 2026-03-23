import { useEffect, useState, useCallback, useRef } from "react";
import { productService, Ingredient, ImportLog, DEFAULT_PRODUCT_IMAGE, resolveImageUrl } from "../../../services/product.service";

export default function ManagerIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [importTarget, setImportTarget] = useState<Ingredient | null>(null);
  const [logsTarget, setLogsTarget] = useState<Ingredient | null>(null);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);

  const [form, setForm] = useState({ ingredientName: "", unit: "", currentQuantity: 0, image: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importForm, setImportForm] = useState({ quantity: 0, note: "" });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIngredients(await productService.getIngredients());
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ingredientName: "", unit: "", currentQuantity: 0, image: "" });
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (i: Ingredient) => {
    setEditing(i);
    setForm({ ingredientName: i.ingredientName, unit: i.unit, currentQuantity: i.currentQuantity, image: i.image ?? "" });
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.ingredientName.trim()) { alert("Tên nguyên liệu không được để trống!"); return; }
    if (!form.unit.trim()) { alert("Đơn vị không được để trống!"); return; }
    if (!editing && form.currentQuantity > 1_000_000) {
      alert("Số lượng vượt mức! (tối đa 1.000.000)");
      return;
    }
    try {
      setUploading(true);
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await productService.uploadIngredientImage(imageFile);
      }
      const payload = { ...form, image: imageUrl };
      if (editing) {
        await productService.updateIngredient(editing.ingredientId, payload);
      } else {
        await productService.createIngredient(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleToggleStatus = async () => {
    if (!deleteTarget) return;
    try {
      const newStatus = deleteTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await productService.updateIngredient(deleteTarget.ingredientId, { status: newStatus } as any);
      setDeleteTarget(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleImport = async () => {
    if (!importTarget) return;
    if (!importForm.quantity || importForm.quantity <= 0) { alert("Số lượng nhập phải lớn hơn 0!"); return; }
    if (importForm.quantity > 1_000_000) { alert("Số lượng vượt mức! (tối đa 1.000.000)"); return; }
    if ((importTarget.currentQuantity + importForm.quantity) > 1_000_000) {
      alert(`Số lượng vượt mức! Tồn kho hiện tại: ${importTarget.currentQuantity}, sau khi nhập sẽ là ${importTarget.currentQuantity + importForm.quantity} (tối đa 1.000.000)`);
      return;
    }
    try {
      await productService.importIngredient(importTarget.ingredientId, importForm.quantity, importForm.note || undefined);
      setImportTarget(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const openLogs = async (i: Ingredient) => {
    setLogsTarget(i);
    try {
      setImportLogs(await productService.getImportLogs(i.ingredientId));
    } catch { setImportLogs([]); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 24, fontWeight: 700 }}>
          Theo dõi nguyên vật liệu
        </h1>
        <button onClick={openCreate} className="font-body text-white px-4 py-2 rounded-lg" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>
          + Thêm nguyên liệu
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--cafe-text-secondary)]">Đang tải...</p>
      ) : ingredients.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[var(--cafe-text-secondary)]">Không có nguyên liệu nào</div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-[var(--cafe-border)]">
          <table className="w-full text-left" style={{ fontSize: 13 }}>
            <thead>
              <tr className="bg-[var(--cafe-surface)] border-b border-[var(--cafe-border)]">
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Hình</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Tên nguyên liệu</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Đơn vị</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Tồn kho</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Trạng thái</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((i) => {
                const inactive = i.status !== "ACTIVE";
                return (
                  <tr
                    key={i.ingredientId}
                    className="border-b border-[var(--cafe-border)] hover:bg-[var(--cafe-surface)]/50"
                    style={{ opacity: inactive ? 0.45 : 1 }}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={resolveImageUrl(i.image)}
                        alt={i.ingredientName}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = DEFAULT_PRODUCT_IMAGE; } }}
                      />
                    </td>
                    <td className="px-4 py-3 font-body font-medium">{i.ingredientName}</td>
                    <td className="px-4 py-3 font-body text-[var(--cafe-text-secondary)]">{i.unit}</td>
                    <td className="px-4 py-3 font-body">
                      <span className={i.currentQuantity <= 10 ? "text-red-600 font-semibold" : ""}>
                        {i.currentQuantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-body ${i.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                        {i.status === "ACTIVE" ? "Khả dụng" : "Không khả dụng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {i.status === "ACTIVE" && (
                          <button onClick={() => { setImportTarget(i); setImportForm({ quantity: 0, note: "" }); }} className="font-body text-green-600 hover:underline" style={{ fontSize: 12 }}>Nhập kho</button>
                        )}
                        <button onClick={() => openLogs(i)} className="font-body text-blue-600 hover:underline" style={{ fontSize: 12 }}>Lịch sử</button>
                        <button onClick={() => openEdit(i)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                        <button onClick={() => setDeleteTarget(i)} className={`font-body hover:underline ${i.status === "ACTIVE" ? "text-red-500" : "text-green-600"}`} style={{ fontSize: 12 }}>
                          {i.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <DialogOverlay onClose={() => setDialogOpen(false)} size="xl">
          <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 18, fontWeight: 700 }}>
            {editing ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
          </h2>
          <div className="flex gap-6">
            {/* Left: Image */}
            <div className="flex-shrink-0 w-56">
              <label className="font-body text-[var(--cafe-text-secondary)] block mb-2" style={{ fontSize: 12 }}>Hình ảnh nguyên liệu</label>
              <div
                className="rounded-xl overflow-hidden border-2 border-dashed border-[var(--cafe-border)] bg-[var(--cafe-surface)] aspect-square flex items-center justify-center cursor-pointer hover:border-[var(--cafe-primary)] transition-colors relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src={imagePreview || resolveImageUrl(form.image)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = DEFAULT_PRODUCT_IMAGE; } }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg className="mx-auto mb-1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span className="font-body" style={{ fontSize: 11 }}>Tải ảnh lên</span>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageSelect}
              />
              {(imagePreview || form.image) && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(""); setForm({ ...form, image: "" }); }}
                  className="font-body text-red-500 hover:underline mt-2 block mx-auto"
                  style={{ fontSize: 11 }}
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            {/* Right: Form */}
            <div className="flex-1 space-y-3">
              <Field label="Tên nguyên liệu" value={form.ingredientName} onChange={(v) => setForm({ ...form, ingredientName: v })} />
              <Field label="Đơn vị (kg, lít, gói...)" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
              <Field
                label={editing ? "Tồn kho hiện tại" : "Số lượng ban đầu"}
                type="number"
                value={String(form.currentQuantity)}
                onChange={(v) => setForm({ ...form, currentQuantity: Number(v) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setDialogOpen(false)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button onClick={handleSave} disabled={uploading} className="font-body text-white px-4 py-2 rounded-lg disabled:opacity-50" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>
              {uploading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </DialogOverlay>
      )}

      {/* Import Dialog */}
      {importTarget && (
        <DialogOverlay onClose={() => setImportTarget(null)}>
          <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 18, fontWeight: 700 }}>
            Nhập kho: {importTarget.ingredientName}
          </h2>
          <div className="space-y-3">
            <Field label="Số lượng nhập" type="number" value={String(importForm.quantity)} onChange={(v) => setImportForm({ ...importForm, quantity: Number(v) })} />
            <Field label="Ghi chú" value={importForm.note} onChange={(v) => setImportForm({ ...importForm, note: v })} />
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setImportTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button onClick={handleImport} className="font-body text-white px-4 py-2 rounded-lg bg-green-600" style={{ fontSize: 13 }}>Nhập kho</button>
          </div>
        </DialogOverlay>
      )}

      {/* Import Logs Dialog */}
      {logsTarget && (
        <DialogOverlay onClose={() => setLogsTarget(null)}>
          <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 18, fontWeight: 700 }}>
            Lịch sử nhập kho: {logsTarget.ingredientName}
          </h2>
          {importLogs.length === 0 ? (
            <p className="font-body text-[var(--cafe-text-secondary)] py-4 text-center" style={{ fontSize: 13 }}>Chưa có lịch sử nhập kho</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left" style={{ fontSize: 12 }}>
                <thead>
                  <tr className="border-b border-[var(--cafe-border)]">
                    <th className="py-2 font-body font-semibold">Số lượng</th>
                    <th className="py-2 font-body font-semibold">Ghi chú</th>
                    <th className="py-2 font-body font-semibold">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {importLogs.map((log, idx) => (
                    <tr key={idx} className="border-b border-[var(--cafe-border)]">
                      <td className="py-2 font-body text-green-600">+{log.quantityImported}</td>
                      <td className="py-2 font-body text-[var(--cafe-text-secondary)]">{log.note || "-"}</td>
                      <td className="py-2 font-body text-[var(--cafe-text-secondary)]">{new Date(log.importedAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={() => setLogsTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Đóng</button>
          </div>
        </DialogOverlay>
      )}

      {/* Toggle status confirm */}
      {deleteTarget && (
        <DialogOverlay onClose={() => setDeleteTarget(null)}>
          <h2 className={`font-heading mb-3 ${deleteTarget.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`} style={{ fontSize: 18, fontWeight: 700 }}>
            {deleteTarget.status === "ACTIVE" ? "Xác nhận vô hiệu hóa" : "Xác nhận kích hoạt"}
          </h2>
          <p className="font-body mb-5" style={{ fontSize: 13 }}>
            Bạn có chắc muốn {deleteTarget.status === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt lại"} <strong>{deleteTarget.ingredientName}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button
              onClick={handleToggleStatus}
              className={`font-body text-white px-4 py-2 rounded-lg ${deleteTarget.status === "ACTIVE" ? "bg-red-600" : "bg-green-600"}`}
              style={{ fontSize: 13 }}
            >
              {deleteTarget.status === "ACTIVE" ? "Vô hiệu" : "Kích hoạt"}
            </button>
          </div>
        </DialogOverlay>
      )}
    </div>
  );
}

/* ═══════════════════════════ SHARED COMPONENTS ═══════════════════════════ */

function DialogOverlay({ children, onClose, size = "md" }: { children: React.ReactNode; onClose: () => void; size?: "md" | "lg" | "xl" }) {
  const maxW = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-xl p-6 w-full shadow-xl mx-4 max-h-[90vh] overflow-y-auto ${maxW}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}
