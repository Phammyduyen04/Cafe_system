import { useEffect, useState, useCallback } from "react";
import { productService, Category } from "../../../services/product.service";

type CategoryFull = Category & { description?: string };

export default function ManagerCategoriesPage() {
  const [categories, setCategories] = useState<CategoryFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryFull | null>(null);
  const [toggleTarget, setToggleTarget] = useState<CategoryFull | null>(null);

  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Manager gets all categories (active + inactive)
      setCategories(await productService.getCategories(true));
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryFull) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Tên danh mục không được để trống!"); return; }
    try {
      if (editing) {
        await productService.updateCategory(editing.categoryId, form);
      } else {
        await productService.createCategory(form);
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.status === "ACTIVE") {
        await productService.deleteCategory(toggleTarget.categoryId);
      } else {
        await productService.reactivateCategory(toggleTarget.categoryId);
      }
      setToggleTarget(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 24, fontWeight: 700 }}>
          Quản lý danh mục sản phẩm
        </h1>
        <button onClick={openCreate} className="font-body text-white px-4 py-2 rounded-lg" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>
          + Thêm danh mục
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--cafe-text-secondary)]">Đang tải...</p>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[var(--cafe-text-secondary)]">Không có danh mục nào</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const inactive = c.status === "INACTIVE";
            return (
              <div
                key={c.categoryId}
                className="bg-white rounded-xl border border-[var(--cafe-border)] p-5 transition-opacity"
                style={{ opacity: inactive ? 0.45 : 1 }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</h3>
                  <span className={`text-xs font-body px-2 py-0.5 rounded ${inactive ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                    {inactive ? "Vô hiệu" : "Hiển thị"}
                  </span>
                </div>
                {c.description && (
                  <p className="font-body text-[var(--cafe-text-secondary)] mb-3" style={{ fontSize: 12 }}>{c.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(c)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                  <button
                    onClick={() => setToggleTarget(c)}
                    className={`font-body hover:underline ${inactive ? "text-green-600" : "text-red-500"}`}
                    style={{ fontSize: 12 }}
                  >
                    {inactive ? "Kích hoạt" : "Vô hiệu hóa"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <DialogOverlay onClose={() => setDialogOpen(false)}>
          <h2 className="font-heading text-[var(--cafe-primary)] mb-4" style={{ fontSize: 18, fontWeight: 700 }}>
            {editing ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </h2>
          <div className="space-y-3">
            <Field label="Tên danh mục *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <div>
              <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>Mô tả</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body resize-none"
                style={{ fontSize: 13 }}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setDialogOpen(false)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button onClick={handleSave} className="font-body text-white px-4 py-2 rounded-lg" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>Lưu</button>
          </div>
        </DialogOverlay>
      )}

      {/* Toggle status confirm */}
      {toggleTarget && (
        <DialogOverlay onClose={() => setToggleTarget(null)}>
          <h2
            className={`font-heading mb-3 ${toggleTarget.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`}
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {toggleTarget.status === "ACTIVE" ? "Xác nhận vô hiệu hóa" : "Xác nhận kích hoạt"}
          </h2>
          <p className="font-body mb-5" style={{ fontSize: 13 }}>
            {toggleTarget.status === "ACTIVE"
              ? <>Danh mục <strong>{toggleTarget.name}</strong> sẽ bị ẩn khỏi trang khách hàng.</>
              : <>Danh mục <strong>{toggleTarget.name}</strong> sẽ hiển thị lại cho khách hàng.</>
            }
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setToggleTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button
              onClick={handleToggle}
              className={`font-body text-white px-4 py-2 rounded-lg ${toggleTarget.status === "ACTIVE" ? "bg-red-600" : "bg-green-600"}`}
              style={{ fontSize: 13 }}
            >
              {toggleTarget.status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"}
            </button>
          </div>
        </DialogOverlay>
      )}
    </div>
  );
}

/* ═══════════════════════════ SHARED COMPONENTS ═══════════════════════════ */

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body"
        style={{ fontSize: 13 }}
      />
    </div>
  );
}
