import { useEffect, useState, useCallback, useRef } from "react";
import {
  productService, Product, Topping, Category,
  DEFAULT_PRODUCT_IMAGE, PRODUCT_STATUS, PRODUCT_STATUS_LABELS,
  TOPPING_STATUS_LABELS, resolveImageUrl,
} from "../../../services/product.service";

const MAX_PRICE = 1_000_000;

type Tab = "products" | "toppings";

export default function ManagerBeveragesPage() {
  const [tab, setTab] = useState<Tab>("products");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 24, fontWeight: 700 }}>
          Quản lý đồ uống
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--cafe-surface)] rounded-lg p-1 w-fit">
        {(["products", "toppings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-body px-5 py-2 rounded-md transition-colors"
            style={{
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: tab === t ? "var(--cafe-primary)" : "transparent",
              color: tab === t ? "#fff" : "var(--cafe-text-secondary)",
            }}
          >
            {t === "products" ? "Sản phẩm" : "Topping"}
          </button>
        ))}
      </div>

      {tab === "products" ? <ProductsSection /> : <ToppingsSection />}
    </div>
  );
}

/* ═══════════════════════════ PRODUCTS SECTION ═══════════════════════════ */

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Product | null>(null);

  const [form, setForm] = useState({ name: "", price: 0, description: "", productCategoryId: "", image: "", status: "ACTIVE" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const [p, c] = await Promise.all([
        productService.getProducts({ all: true }),
        productService.getCategories(true),
      ]);
      setProducts(p);
      setCategories(c);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: 0, description: "", productCategoryId: categories[0]?.categoryId ?? "", image: "", status: "ACTIVE" });
    setErrors({});
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: p.price,
      description: p.description,
      productCategoryId: p.productCategoryId ?? (typeof p.category === "string" ? p.category : p.category?.categoryId ?? ""),
      image: p.image ?? "",
      status: p.status ?? (p.isAvailable ? "ACTIVE" : "INACTIVE"),
    });
    setErrors({});
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên sản phẩm không được để trống";
    if (!form.price || form.price <= 0) e.price = "Giá phải lớn hơn 0";
    else if (form.price > MAX_PRICE) e.price = "Số tiền sản phẩm vượt mức! (tối đa 1.000.000đ)";
    if (!form.productCategoryId) e.productCategoryId = "Vui lòng chọn danh mục";
    if (!form.status) e.status = "Vui lòng chọn trạng thái";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setUploading(true);
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await productService.uploadProductImage(imageFile);
      }
      const payload = {
        ...form,
        image: imageUrl,
        isAvailable: form.status === PRODUCT_STATUS.ACTIVE,
      };
      if (editing) {
        await productService.updateProduct(editing._id, payload);
      } else {
        await productService.createProduct(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.isAvailable) {
        await productService.deactivateProduct(toggleTarget._id);
      } else {
        await productService.reactivateProduct(toggleTarget._id);
      }
      setToggleTarget(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const getCatName = (p: Product) => {
    if (typeof p.category === "object" && p.category?.name) return p.category.name;
    const id = p.productCategoryId ?? (typeof p.category === "string" ? p.category : "");
    return categories.find((c) => c.categoryId === id || c._id === id)?.name ?? "";
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="font-body text-white px-4 py-2 rounded-lg" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>
          + Thêm sản phẩm
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--cafe-text-secondary)]">Đang tải...</p>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[var(--cafe-text-secondary)]">Không có sản phẩm nào</div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-[var(--cafe-border)]">
          <table className="w-full text-left" style={{ fontSize: 13 }}>
            <thead>
              <tr className="bg-[var(--cafe-surface)] border-b border-[var(--cafe-border)]">
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Hình</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Tên</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Danh mục</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Giá</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Trạng thái</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const inactive = !p.isAvailable;
                return (
                  <tr
                    key={p._id}
                    className="border-b border-[var(--cafe-border)] hover:bg-[var(--cafe-surface)]/50 transition-opacity"
                    style={{ opacity: inactive ? 0.45 : 1 }}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={resolveImageUrl(p.image)}
                        alt={p.name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = DEFAULT_PRODUCT_IMAGE; } }}
                      />
                    </td>
                    <td className="px-4 py-3 font-body font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-body text-[var(--cafe-text-secondary)]">{getCatName(p)}</td>
                    <td className="px-4 py-3 font-body">{p.price.toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-body ${
                        p.status === "OUT_OF_SEASON" ? "bg-orange-100 text-orange-700" :
                        p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {PRODUCT_STATUS_LABELS[p.status ?? (p.isAvailable ? "ACTIVE" : "INACTIVE")] ?? "Đang bán"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      <button
                        onClick={() => setToggleTarget(p)}
                        className={`font-body hover:underline ${inactive ? "text-green-600" : "text-red-500"}`}
                        style={{ fontSize: 12 }}
                      >
                        {inactive ? "Kích hoạt" : "Vô hiệu"}
                      </button>
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
            {editing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
          <div className="flex gap-6">
            {/* Left: Image preview */}
            <div className="flex-shrink-0 w-56">
              <label className="font-body text-[var(--cafe-text-secondary)] block mb-2" style={{ fontSize: 12 }}>Hình ảnh sản phẩm</label>
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
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
              {(imagePreview || form.image) && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); setForm({ ...form, image: "" }); }} className="font-body text-red-500 hover:underline mt-2 block mx-auto" style={{ fontSize: 11 }}>
                  Xóa ảnh
                </button>
              )}
            </div>

            {/* Right: Form fields */}
            <div className="flex-1 space-y-3">
              <FieldWithError label="Tên sản phẩm *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} />
              <FieldWithError
                label="Giá (VND) *"
                type="number"
                value={String(form.price)}
                onChange={(v) => setForm({ ...form, price: Number(v) })}
                error={errors.price}
              />
              <TextArea label="Mô tả" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div>
                <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>Danh mục *</label>
                <select
                  value={form.productCategoryId}
                  onChange={(e) => setForm({ ...form, productCategoryId: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 font-body ${errors.productCategoryId ? "border-red-400" : "border-[var(--cafe-border)]"}`}
                  style={{ fontSize: 13 }}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.filter(c => c.status === "ACTIVE").map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
                {errors.productCategoryId && <p className="text-red-500 font-body mt-0.5" style={{ fontSize: 11 }}>{errors.productCategoryId}</p>}
              </div>
              <div>
                <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>Trạng thái *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body" style={{ fontSize: 13 }}
                >
                  {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
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

      {/* Toggle confirm */}
      {toggleTarget && (
        <DialogOverlay onClose={() => setToggleTarget(null)}>
          <h2 className={`font-heading mb-3 ${toggleTarget.isAvailable ? "text-red-600" : "text-green-600"}`} style={{ fontSize: 18, fontWeight: 700 }}>
            {toggleTarget.isAvailable ? "Xác nhận vô hiệu hóa" : "Xác nhận kích hoạt"}
          </h2>
          <p className="font-body mb-5" style={{ fontSize: 13 }}>
            {toggleTarget.isAvailable
              ? <>Sản phẩm <strong>{toggleTarget.name}</strong> sẽ bị ẩn khỏi trang khách hàng.</>
              : <>Sản phẩm <strong>{toggleTarget.name}</strong> sẽ hiển thị lại cho khách hàng.</>
            }
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setToggleTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button onClick={handleToggle} className={`font-body text-white px-4 py-2 rounded-lg ${toggleTarget.isAvailable ? "bg-red-600" : "bg-green-600"}`} style={{ fontSize: 13 }}>
              {toggleTarget.isAvailable ? "Vô hiệu hóa" : "Kích hoạt"}
            </button>
          </div>
        </DialogOverlay>
      )}
    </>
  );
}

/* ═══════════════════════════ TOPPINGS SECTION ═══════════════════════════ */

function ToppingsSection() {
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Topping | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Topping | null>(null);

  const [form, setForm] = useState({ name: "", price: 0, image: "", status: "ACTIVE" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setToppings(await productService.getToppings(true));
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", price: 0, image: "", status: "ACTIVE" });
    setErrors({});
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (t: Topping) => {
    setEditing(t);
    setForm({ name: t.name, price: t.price, image: t.image ?? "", status: t.status ?? "ACTIVE" });
    setErrors({});
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Tên topping không được để trống";
    if (!form.price || form.price <= 0) e.price = "Giá phải lớn hơn 0";
    else if (form.price > MAX_PRICE) e.price = "Số tiền sản phẩm vượt mức! (tối đa 1.000.000đ)";
    if (!form.status) e.status = "Vui lòng chọn trạng thái";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setUploading(true);
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await productService.uploadToppingImage(imageFile);
      }
      const payload = { name: form.name, price: form.price, image: imageUrl, status: form.status, isAvailable: form.status === "ACTIVE" };
      if (editing) {
        await productService.updateTopping(editing.toppingId, payload);
      } else {
        await productService.createTopping(payload);
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { alert(e.message); } finally { setUploading(false); }
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    try {
      const newStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await productService.deactivateTopping(toggleTarget.toppingId, newStatus);
      setToggleTarget(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="font-body text-white px-4 py-2 rounded-lg" style={{ fontSize: 13, backgroundColor: "var(--cafe-primary)" }}>
          + Thêm topping
        </button>
      </div>

      {loading ? (
        <p className="text-center py-10 text-[var(--cafe-text-secondary)]">Đang tải...</p>
      ) : toppings.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-[var(--cafe-text-secondary)]">Không có topping nào</div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden border border-[var(--cafe-border)]">
          <table className="w-full text-left" style={{ fontSize: 13 }}>
            <thead>
              <tr className="bg-[var(--cafe-surface)] border-b border-[var(--cafe-border)]">
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Hình</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Tên</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Giá</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Trạng thái</th>
                <th className="px-4 py-3 font-body font-semibold text-[var(--cafe-text-secondary)]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {toppings.map((t) => {
                const inactive = t.status !== "ACTIVE";
                return (
                  <tr
                    key={t._id}
                    className="border-b border-[var(--cafe-border)] hover:bg-[var(--cafe-surface)]/50 transition-opacity"
                    style={{ opacity: inactive ? 0.45 : 1 }}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={resolveImageUrl(t.image)}
                        alt={t.name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => { const img = e.target as HTMLImageElement; if (!img.dataset.fallback) { img.dataset.fallback = "1"; img.src = DEFAULT_PRODUCT_IMAGE; } }}
                      />
                    </td>
                    <td className="px-4 py-3 font-body font-medium">{t.name}</td>
                    <td className="px-4 py-3 font-body">{t.price.toLocaleString("vi-VN")}đ</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-body ${
                        t.status === "OUT_OF_SEASON" ? "bg-orange-100 text-orange-700" :
                        t.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {TOPPING_STATUS_LABELS[t.status ?? "ACTIVE"] ?? "Đang bán"}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(t)} className="font-body text-[var(--cafe-gold)] hover:underline" style={{ fontSize: 12 }}>Sửa</button>
                      <button
                        onClick={() => setToggleTarget(t)}
                        className={`font-body hover:underline ${inactive ? "text-green-600" : "text-red-500"}`}
                        style={{ fontSize: 12 }}
                      >
                        {inactive ? "Kích hoạt" : "Vô hiệu"}
                      </button>
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
            {editing ? "Chỉnh sửa topping" : "Thêm topping mới"}
          </h2>
          <div className="flex gap-6">
            {/* Left: Image */}
            <div className="flex-shrink-0 w-56">
              <label className="font-body text-[var(--cafe-text-secondary)] block mb-2" style={{ fontSize: 12 }}>Hình ảnh topping</label>
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
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />
              {(imagePreview || form.image) && (
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); setForm({ ...form, image: "" }); }} className="font-body text-red-500 hover:underline mt-2 block mx-auto" style={{ fontSize: 11 }}>
                  Xóa ảnh
                </button>
              )}
            </div>

            {/* Right: Form */}
            <div className="flex-1 space-y-3">
              <FieldWithError label="Tên topping *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} error={errors.name} />
              <FieldWithError
                label="Giá (VND) *"
                type="number"
                value={String(form.price)}
                onChange={(v) => setForm({ ...form, price: Number(v) })}
                error={errors.price}
              />
              <div>
                <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>Trạng thái *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body" style={{ fontSize: 13 }}
                >
                  {Object.entries(TOPPING_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
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

      {/* Toggle confirm */}
      {toggleTarget && (
        <DialogOverlay onClose={() => setToggleTarget(null)}>
          <h2 className={`font-heading mb-3 ${toggleTarget.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`} style={{ fontSize: 18, fontWeight: 700 }}>
            {toggleTarget.status === "ACTIVE" ? "Xác nhận vô hiệu hóa" : "Xác nhận kích hoạt"}
          </h2>
          <p className="font-body mb-5" style={{ fontSize: 13 }}>
            {toggleTarget.status === "ACTIVE"
              ? <>Topping <strong>{toggleTarget.name}</strong> sẽ bị ẩn khỏi trang khách hàng.</>
              : <>Topping <strong>{toggleTarget.name}</strong> sẽ hiển thị lại cho khách hàng.</>
            }
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setToggleTarget(null)} className="font-body px-4 py-2 rounded-lg border border-[var(--cafe-border)]" style={{ fontSize: 13 }}>Hủy</button>
            <button onClick={handleToggle} className={`font-body text-white px-4 py-2 rounded-lg ${toggleTarget.status === "ACTIVE" ? "bg-red-600" : "bg-green-600"}`} style={{ fontSize: 13 }}>
              {toggleTarget.status === "ACTIVE" ? "Vô hiệu hóa" : "Kích hoạt"}
            </button>
          </div>
        </DialogOverlay>
      )}
    </>
  );
}

/* ═══════════════════════════ SHARED COMPONENTS ═══════════════════════════ */

function DialogOverlay({ children, onClose, size = "md" }: { children: React.ReactNode; onClose: () => void; size?: "md" | "lg" | "xl" }) {
  const maxW = size === "xl" ? "max-w-3xl" : size === "lg" ? "max-w-xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className={`bg-white rounded-xl p-6 w-full shadow-xl mx-4 max-h-[90vh] overflow-y-auto ${maxW}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FieldWithError({ label, value, onChange, type = "text", error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; error?: string;
}) {
  return (
    <div>
      <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-lg px-3 py-2 font-body ${error ? "border-red-400" : "border-[var(--cafe-border)]"}`}
        style={{ fontSize: 13 }}
      />
      {error && <p className="text-red-500 font-body mt-0.5" style={{ fontSize: 11 }}>{error}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="font-body text-[var(--cafe-text-secondary)] block mb-1" style={{ fontSize: 12 }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--cafe-border)] rounded-lg px-3 py-2 font-body resize-none"
        style={{ fontSize: 13, minHeight: 80 }}
        rows={Math.max(3, Math.ceil(value.length / 50))}
      />
    </div>
  );
}
