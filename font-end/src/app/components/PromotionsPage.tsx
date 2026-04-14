import { useEffect, useRef, useState, type ReactNode } from "react";
import { promotionService, type Promotion, type Discount, type PromotionCondition, type DiscountCondition } from "../../services/promotion.service";
import { productService, type Product, type Category } from "../../services/product.service";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const resolveImageUrl = (url?: string) =>
  url?.startsWith("/uploads/") ? `${API_BASE}${url}` : url ?? "";

// ── Helpers ────────────────────────────────────────────────────────────────
const BENEFIT_LABELS: Record<string, string> = {
  BUY_X_GET_Y: "Mua X tặng Y",
  FREE_ITEM: "Tặng sản phẩm",
  GIFT_WITH_ORDER: "Quà kèm đơn hàng",
};

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  REGULAR: "Khách thường",
  VIP: "Khách VIP",
  MEMBER: "Thành viên",
  NEW: "Khách mới",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}


function getProductName(productId: string, products: Product[]) {
  const p = products.find((x) => x._id === productId || (x as any).productId === productId);
  return p?.name ?? productId;
}

function getCatName(catId: string, categories: Category[]) {
  const c = categories.find((x) => x._id === catId || x.categoryId === catId);
  return c?.name ?? catId;
}

// ── Detail Modal ────────────────────────────────────────────────────────────
interface DetailState {
  type: "promotion" | "discount";
  item: Promotion | Discount;
  products: Product[];
  categories: Category[];
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-[var(--cafe-gold)]" />
      <span className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
        {children}
      </span>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--cafe-bg)] last:border-0">
      <span className="font-body text-[var(--cafe-primary)]/50 flex-shrink-0 w-36" style={{ fontSize: 12.5 }}>{label}</span>
      <span className="font-body text-[var(--cafe-primary)] flex-1" style={{ fontSize: 12.5, fontWeight: 500 }}>{children}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return <span className="text-[var(--cafe-primary)]/40 italic" style={{ fontSize: 12 }}>Tất cả</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="font-body px-2 py-0.5 rounded-full bg-[var(--cafe-primary)]/8 text-[var(--cafe-primary)]"
          style={{ fontSize: 11.5, fontWeight: 500, backgroundColor: "rgba(var(--cafe-primary-rgb, 62,39,35), 0.07)" }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function PromotionDetailContent({ promo, products }: { promo: Promotion; products: Product[] }) {
  const cond = promo.conditions as PromotionCondition | undefined;

  return (
    <div className="space-y-5">
      {/* Mô tả */}
      {promo.description && (
        <div>
          <SectionTitle>Mô tả chương trình</SectionTitle>
          <p className="font-body text-[var(--cafe-primary)]/70 leading-relaxed" style={{ fontSize: 13.5 }}>
            {promo.description}
          </p>
        </div>
      )}

      {/* Thời gian */}
      <div>
        <SectionTitle>Thời gian áp dụng</SectionTitle>
        <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
          <InfoRow label="Bắt đầu">{formatDate(promo.startDate)}</InfoRow>
          <InfoRow label="Kết thúc">{formatDate(promo.endDate)}</InfoRow>
        </div>
      </div>

      {/* Điều kiện */}
      {cond && (
        <div>
          <SectionTitle>Điều kiện áp dụng</SectionTitle>
          <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
            {cond.minimumOrderAmount != null && cond.minimumOrderAmount > 0 && (
              <InfoRow label="Giá trị đơn tối thiểu">
                {cond.minimumOrderAmount.toLocaleString("vi-VN")}đ
              </InfoRow>
            )}
            {cond.applicableCustomerTypes && cond.applicableCustomerTypes.length > 0 && (
              <InfoRow label="Loại khách hàng">
                <TagList items={cond.applicableCustomerTypes.map((t) => CUSTOMER_TYPE_LABELS[t] ?? t)} />
              </InfoRow>
            )}
          </div>
        </div>
      )}

      {/* Sản phẩm kích hoạt */}
      {cond && cond.triggerProducts && cond.triggerProducts.length > 0 && (
        <div>
          <SectionTitle>Sản phẩm kích hoạt khuyến mãi</SectionTitle>
          <div className="space-y-2">
            {cond.triggerProducts.map((tp, i) => (
              <div key={i} className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
                <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>
                  {getProductName(tp.productId, products)}
                </span>
                <span className="font-body px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700" style={{ fontSize: 12, fontWeight: 700 }}>
                  × {tp.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sản phẩm được tặng */}
      {cond && cond.rewardProducts && cond.rewardProducts.length > 0 && (
        <div>
          <SectionTitle>Sản phẩm được tặng</SectionTitle>
          <div className="space-y-2">
            {cond.rewardProducts.map((rp, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5 border border-green-100">
                <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 500 }}>
                  {getProductName(rp.productId, products)}
                </span>
                <span className="font-body px-2.5 py-0.5 rounded-full bg-green-100 text-green-700" style={{ fontSize: 12, fontWeight: 700 }}>
                  × {rp.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupon & lượt dùng */}
      {(promo.couponCode || promo.maxUsage != null) && (
        <div>
          <SectionTitle>Thông tin sử dụng</SectionTitle>
          <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
            {promo.couponCode && (
              <InfoRow label="Mã coupon">
                <span className="font-body bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-lg"
                  style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>
                  {promo.couponCode}
                </span>
              </InfoRow>
            )}
            {promo.maxUsage != null && (
              <InfoRow label="Lượt dùng còn lại">
                <span className="font-body font-semibold text-[var(--cafe-primary)]">
                  {Math.max(0, promo.maxUsage - (promo.usageCount ?? 0))}
                  <span className="text-[var(--cafe-primary)]/40 font-normal"> / {promo.maxUsage} lượt</span>
                </span>
              </InfoRow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DiscountDetailContent({ disc, products, categories }: { disc: Discount; products: Product[]; categories: Category[] }) {
  const cond = disc.conditions as DiscountCondition | undefined;
  const valueDisplay = disc.discountType === "PERCENT"
    ? `Giảm ${disc.discountValue}%`
    : `Giảm ${disc.discountValue.toLocaleString("vi-VN")}đ`;

  return (
    <div className="space-y-5">
      {/* Mô tả */}
      {disc.description && (
        <div>
          <SectionTitle>Mô tả chương trình</SectionTitle>
          <p className="font-body text-[var(--cafe-primary)]/70 leading-relaxed" style={{ fontSize: 13.5 }}>
            {disc.description}
          </p>
        </div>
      )}

      {/* Mức giảm */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-[var(--cafe-primary)]/5 to-[var(--cafe-gold)]/10 rounded-2xl p-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: disc.discountType === "PERCENT" ? "#dbeafe" : "#fef9c3" }}>
          <span className="font-heading" style={{ fontSize: 20, fontWeight: 900, color: disc.discountType === "PERCENT" ? "#2563eb" : "#ca8a04" }}>
            {disc.discountType === "PERCENT" ? `${disc.discountValue}%` : "-đ"}
          </span>
        </div>
        <div>
          <p className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11.5 }}>Mức ưu đãi</p>
          <p className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 800 }}>{valueDisplay}</p>
        </div>
      </div>

      {/* Thời gian */}
      <div>
        <SectionTitle>Thời gian áp dụng</SectionTitle>
        <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
          <InfoRow label="Bắt đầu">{formatDate(disc.startDate)}</InfoRow>
          <InfoRow label="Kết thúc">{formatDate(disc.endDate)}</InfoRow>
        </div>
      </div>

      {/* Khung giờ */}
      {cond && cond.timeFrames && cond.timeFrames.length > 0 && (
        <div>
          <SectionTitle>Khung giờ áp dụng trong ngày</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {cond.timeFrames.map((tf, i) => (
              <div key={i} className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-purple-500">
                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                </svg>
                <span className="font-body text-purple-700" style={{ fontSize: 13, fontWeight: 700 }}>
                  {tf.from} – {tf.to}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Điều kiện */}
      {cond && (
        <div>
          <SectionTitle>Điều kiện áp dụng</SectionTitle>
          <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
            {cond.minimumOrderAmount != null && cond.minimumOrderAmount > 0 ? (
              <InfoRow label="Giá trị đơn tối thiểu">
                {cond.minimumOrderAmount.toLocaleString("vi-VN")}đ
              </InfoRow>
            ) : (
              <InfoRow label="Giá trị đơn tối thiểu">
                <span className="italic text-[var(--cafe-primary)]/40" style={{ fontSize: 12 }}>Không yêu cầu</span>
              </InfoRow>
            )}
            <InfoRow label="Loại khách hàng">
              {cond.applicableCustomerTypes && cond.applicableCustomerTypes.length > 0
                ? <TagList items={cond.applicableCustomerTypes.map((t) => CUSTOMER_TYPE_LABELS[t] ?? t)} />
                : <span className="italic text-[var(--cafe-primary)]/40" style={{ fontSize: 12 }}>Tất cả khách hàng</span>
              }
            </InfoRow>
          </div>
        </div>
      )}

      {/* Sản phẩm áp dụng */}
      {cond && cond.applicableProductIds && cond.applicableProductIds.length > 0 && (
        <div>
          <SectionTitle>Áp dụng cho sản phẩm</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {cond.applicableProductIds.map((pid, i) => (
              <span key={i} className="font-body px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700"
                style={{ fontSize: 12.5, fontWeight: 500 }}>
                {getProductName(pid, products)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Danh mục áp dụng */}
      {cond && cond.applicableCategoryIds && cond.applicableCategoryIds.length > 0 && (
        <div>
          <SectionTitle>Áp dụng cho danh mục</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {cond.applicableCategoryIds.map((cid, i) => (
              <span key={i} className="font-body px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700"
                style={{ fontSize: 12.5, fontWeight: 500 }}>
                {getCatName(cid, categories)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Không có giới hạn sản phẩm/danh mục */}
      {cond && (!cond.applicableProductIds || cond.applicableProductIds.length === 0) &&
        (!cond.applicableCategoryIds || cond.applicableCategoryIds.length === 0) && (
          <div>
            <SectionTitle>Phạm vi áp dụng</SectionTitle>
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-body text-green-700" style={{ fontSize: 13, fontWeight: 500 }}>
                Áp dụng cho toàn bộ sản phẩm & danh mục
              </span>
            </div>
          </div>
        )}

      {/* Coupon & lượt dùng */}
      {(disc.couponCode || disc.maxUsage != null) && (
        <div>
          <SectionTitle>Thông tin sử dụng</SectionTitle>
          <div className="bg-[var(--cafe-bg)] rounded-xl px-4 py-1">
            {disc.couponCode && (
              <InfoRow label="Mã coupon">
                <span className="font-body bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-lg"
                  style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, letterSpacing: 1 }}>
                  {disc.couponCode}
                </span>
              </InfoRow>
            )}
            {disc.maxUsage != null && (
              <InfoRow label="Lượt dùng còn lại">
                <span className="font-body font-semibold text-[var(--cafe-primary)]">
                  {Math.max(0, disc.maxUsage - (disc.usageCount ?? 0))}
                  <span className="text-[var(--cafe-primary)]/40 font-normal"> / {disc.maxUsage} lượt</span>
                </span>
              </InfoRow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailModal({ detail, onClose }: { detail: DetailState; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { type, item, products, categories } = detail;
  const isPromo = type === "promotion";
  const promo = item as Promotion;
  const disc = item as Discount;
  const name = isPromo ? promo.promotionName : disc.discountName;
  const imageUrl = item.image ? resolveImageUrl(item.image) : "";
  const isActive = item.status === "ACTIVE";

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div ref={overlayRef} onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "92vh" }}>

        {/* Header */}
        <div className="relative flex-shrink-0">
          {/* Ảnh hoặc gradient header */}
          <div className="relative w-full h-48 overflow-hidden"
            style={{
              background: isPromo
                ? "linear-gradient(135deg, var(--cafe-primary) 0%, #6b3a2a 100%)"
                : disc.discountType === "PERCENT"
                  ? "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)"
                  : "linear-gradient(135deg, #ca8a04 0%, #f59e0b 100%)"
            }}>
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {isPromo ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                ) : (
                  <span className="font-heading text-white/20" style={{ fontSize: 80, fontWeight: 900 }}>%</span>
                )}
              </div>
            )}
            {/* Gradient overlay khi có ảnh */}
            {imageUrl && <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {isActive ? (
                <span className="font-body px-2.5 py-1 rounded-full bg-green-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                  Đang diễn ra
                </span>
              ) : (
                <span className="font-body px-2.5 py-1 rounded-full bg-blue-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                  Sắp diễn ra
                </span>
              )}
              {isPromo && (
                <span className="font-body px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm" style={{ fontSize: 11, fontWeight: 600 }}>
                  {BENEFIT_LABELS[promo.benefitType] ?? promo.benefitType}
                </span>
              )}
            </div>

            {/* Close button */}
            <button onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Đóng">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Tên chương trình */}
            <div className="absolute bottom-3 left-4 right-12">
              <p className="font-heading text-white leading-snug" style={{ fontSize: 20, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                {name}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isPromo
            ? <PromotionDetailContent promo={promo} products={products} />
            : <DiscountDetailContent disc={disc} products={products} categories={categories} />
          }
        </div>

        {/* Footer — coupon highlight nếu có */}
        {item.couponCode && (
          <div className="flex-shrink-0 border-t border-[var(--cafe-border)] px-5 py-4 bg-amber-50">
            <p className="font-body text-amber-700 mb-1" style={{ fontSize: 11.5 }}>Nhập mã này khi thanh toán để áp dụng ưu đãi</p>
            <div className="flex items-center gap-3">
              <span className="font-body flex-1 text-center bg-white border-2 border-dashed border-amber-300 text-amber-700 px-4 py-2 rounded-xl"
                style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, letterSpacing: 3 }}>
                {item.couponCode}
              </span>
              <button
                onClick={() => { navigator.clipboard?.writeText(item.couponCode!); }}
                className="font-body px-4 py-2 rounded-xl bg-amber-400 text-white hover:bg-amber-500 transition-colors flex-shrink-0"
                style={{ fontSize: 12, fontWeight: 700 }}>
                Sao chép
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────
function PromotionCard({ promo, onClick }: { promo: Promotion; onClick: () => void }) {
  const isActive = promo.status === "ACTIVE";
  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-[var(--cafe-border)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer">
      {/* Ảnh minh họa */}
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-[var(--cafe-primary)]/10 to-[var(--cafe-gold)]/20 flex items-center justify-center overflow-hidden">
        {promo.image ? (
          <img src={resolveImageUrl(promo.image)} alt={promo.promotionName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="text-center px-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--cafe-primary)]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ color: "var(--cafe-primary)" }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="font-heading text-[var(--cafe-primary)] text-center leading-snug"
              style={{ fontSize: 16, fontWeight: 700 }}>
              {promo.promotionName}
            </p>
          </div>
        )}
        <div className="absolute top-3 left-3">
          {isActive ? (
            <span className="font-body px-2.5 py-1 rounded-full bg-green-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>Đang diễn ra</span>
          ) : (
            <span className="font-body px-2.5 py-1 rounded-full bg-blue-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>Sắp diễn ra</span>
          )}
        </div>
        {promo.couponCode && (
          <div className="absolute top-3 right-3">
            <span className="font-body px-2.5 py-1 rounded-full bg-amber-400 text-white" style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}>
              {promo.couponCode}
            </span>
          </div>
        )}
        {/* Xem chi tiết hint */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors flex items-end justify-end p-3 opacity-0 hover:opacity-100">
          <span className="font-body text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm" style={{ fontSize: 11 }}>
            Xem chi tiết →
          </span>
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading text-[var(--cafe-primary)] leading-snug" style={{ fontSize: 15, fontWeight: 700 }}>
            {promo.promotionName}
          </h3>
          <span className="font-body px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap flex-shrink-0"
            style={{ fontSize: 11, fontWeight: 600 }}>
            {BENEFIT_LABELS[promo.benefitType] ?? promo.benefitType}
          </span>
        </div>

        {promo.description && (
          <p className="font-body text-[var(--cafe-primary)]/60 mb-3 line-clamp-2" style={{ fontSize: 13 }}>
            {promo.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-[var(--cafe-bg)] flex items-center justify-between">
          <div className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>
            {formatDate(promo.startDate)} – {formatDate(promo.endDate)}
          </div>
          {promo.maxUsage != null && (
            <div className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>
              Còn {Math.max(0, promo.maxUsage - (promo.usageCount ?? 0))} lượt
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiscountCard({ disc, onClick }: { disc: Discount; onClick: () => void }) {
  const isActive = disc.status === "ACTIVE";
  const valueDisplay = disc.discountType === "PERCENT"
    ? `Giảm ${disc.discountValue}%`
    : `Giảm ${disc.discountValue.toLocaleString("vi-VN")}đ`;

  return (
    <div onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden border border-[var(--cafe-border)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer">
      {/* Ảnh minh họa */}
      <div className="relative w-full aspect-[16/9] flex items-center justify-center overflow-hidden"
        style={{ background: disc.discountType === "PERCENT" ? "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" : "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)" }}>
        {disc.image ? (
          <img src={resolveImageUrl(disc.image)} alt={disc.discountName}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div className="text-center px-6">
            <div className="font-heading mb-1" style={{ fontSize: 40, fontWeight: 900, color: disc.discountType === "PERCENT" ? "#2563eb" : "#ca8a04", lineHeight: 1 }}>
              {disc.discountType === "PERCENT" ? `${disc.discountValue}%` : `-${disc.discountValue.toLocaleString("vi-VN")}đ`}
            </div>
            <p className="font-heading" style={{ fontSize: 14, fontWeight: 600, color: disc.discountType === "PERCENT" ? "#1d4ed8" : "#92400e" }}>
              {disc.discountName}
            </p>
          </div>
        )}
        <div className="absolute top-3 left-3">
          {isActive ? (
            <span className="font-body px-2.5 py-1 rounded-full bg-green-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>Đang diễn ra</span>
          ) : (
            <span className="font-body px-2.5 py-1 rounded-full bg-blue-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>Sắp diễn ra</span>
          )}
        </div>
        {disc.couponCode && (
          <div className="absolute top-3 right-3">
            <span className="font-body px-2.5 py-1 rounded-full bg-amber-400 text-white" style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 800 }}>
              {disc.couponCode}
            </span>
          </div>
        )}
      </div>

      {/* Nội dung */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading text-[var(--cafe-primary)] leading-snug" style={{ fontSize: 15, fontWeight: 700 }}>
            {disc.discountName}
          </h3>
          <span className="font-body px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
            style={{ fontSize: 11, fontWeight: 700, backgroundColor: disc.discountType === "PERCENT" ? "#dbeafe" : "#fef9c3", color: disc.discountType === "PERCENT" ? "#2563eb" : "#ca8a04" }}>
            {valueDisplay}
          </span>
        </div>

        {disc.description && (
          <p className="font-body text-[var(--cafe-primary)]/60 mb-3 line-clamp-2" style={{ fontSize: 13 }}>
            {disc.description}
          </p>
        )}

        {disc.couponCode && (
          <div className="mb-3 flex items-center gap-2">
            <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 12 }}>Mã coupon:</span>
            <span className="font-body bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded"
              style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
              {disc.couponCode}
            </span>
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-[var(--cafe-bg)] flex items-center justify-between">
          <div className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>
            {formatDate(disc.startDate)} – {formatDate(disc.endDate)}
          </div>
          {disc.maxUsage != null && (
            <div className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 11 }}>
              Còn {Math.max(0, disc.maxUsage - (disc.usageCount ?? 0))} lượt
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "promotion" | "discount">("all");

  // Detail modal
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [promoRes, discRes] = await Promise.all([
          promotionService.getPromotions({ limit: 50 }),
          promotionService.getDiscounts({ limit: 50 }),
        ]);
        const promoEnvelope = promoRes as any;
        const discEnvelope = discRes as any;
        const promoList: Promotion[] = promoEnvelope?.data ?? [];
        const discList: Discount[] = discEnvelope?.data ?? [];

        setPromotions(promoList.filter((p) => p.status === "ACTIVE" || p.status === "PLANNED"));
        setDiscounts(discList.filter((d) => d.status === "ACTIVE" || d.status === "PLANNED"));
      } catch {
        setPromotions([]); setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openDetail = async (type: "promotion" | "discount", id: string) => {
    setDetailLoading(true);
    try {
      let item: Promotion | Discount;
      if (type === "promotion") {
        item = await promotionService.getPromotionById(id);
      } else {
        item = await promotionService.getDiscountById(id);
      }

      const cond = (item as any).conditions;
      let products: Product[] = [];
      let categories: Category[] = [];

      // Kiểm tra có cần fetch sản phẩm/danh mục không
      const needProducts =
        cond?.triggerProducts?.length > 0 ||
        cond?.rewardProducts?.length > 0 ||
        cond?.applicableProductIds?.length > 0;
      const needCategories = cond?.applicableCategoryIds?.length > 0;

      const fetches: Promise<any>[] = [];
      if (needProducts) fetches.push(productService.getProducts());
      if (needCategories) fetches.push(productService.getCategories());

      const results = await Promise.all(fetches);
      let idx = 0;
      if (needProducts) { products = results[idx++]; }
      if (needCategories) { categories = results[idx++]; }

      setDetail({ type, item, products, categories });
    } catch {
      // Nếu lỗi vẫn hiện modal với data từ list
    } finally {
      setDetailLoading(false);
    }
  };

  const totalActive = promotions.filter((p) => p.status === "ACTIVE").length + discounts.filter((d) => d.status === "ACTIVE").length;
  const totalPlanned = promotions.filter((p) => p.status === "PLANNED").length + discounts.filter((d) => d.status === "PLANNED").length;

  const tabs = [
    { key: "all", label: "Tất cả ưu đãi", count: promotions.length + discounts.length },
    { key: "promotion", label: "Chương trình khuyến mãi", count: promotions.length },
    { key: "discount", label: "Chương trình giảm giá", count: discounts.length },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--cafe-bg)]">
      {/* Hero banner */}
      <div className="bg-[var(--cafe-primary)] text-white py-14 px-4 text-center">
        <h1 className="font-heading mb-3" style={{ fontSize: 38, fontWeight: 900, letterSpacing: -0.5 }}>
          Khuyến mãi & Ưu đãi
        </h1>
        <p className="font-body opacity-80 max-w-lg mx-auto" style={{ fontSize: 15 }}>
          Những chương trình ưu đãi hấp dẫn dành cho bạn. Đừng bỏ lỡ cơ hội tiết kiệm!
        </p>
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="text-center">
            <div className="font-heading" style={{ fontSize: 32, fontWeight: 900, color: "var(--cafe-gold)" }}>{totalActive}</div>
            <div className="font-body opacity-70" style={{ fontSize: 12 }}>Đang diễn ra</div>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center">
            <div className="font-heading" style={{ fontSize: 32, fontWeight: 900, color: "var(--cafe-gold)" }}>{totalPlanned}</div>
            <div className="font-body opacity-70" style={{ fontSize: 12 }}>Sắp diễn ra</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`font-body px-5 py-2.5 rounded-full whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-[var(--cafe-primary)] text-white shadow-md" : "bg-white text-[var(--cafe-primary)] border border-[var(--cafe-border)] hover:border-[var(--cafe-primary)]"}`}
              style={{ fontSize: 13, fontWeight: 600 }}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-[var(--cafe-bg)]"}`}
                  style={{ fontSize: 11 }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Promotions section */}
            {(activeTab === "all" || activeTab === "promotion") && promotions.length > 0 && (
              <div className="mb-10">
                {activeTab === "all" && (
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 22, fontWeight: 700 }}>
                      Chương trình khuyến mãi
                    </h2>
                    <div className="flex-1 h-px bg-[var(--cafe-border)]" />
                    <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>{promotions.length} chương trình</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {promotions.map((promo) => (
                    <PromotionCard key={promo.promotionId} promo={promo}
                      onClick={() => openDetail("promotion", promo.promotionId)} />
                  ))}
                </div>
              </div>
            )}

            {/* Discounts section */}
            {(activeTab === "all" || activeTab === "discount") && discounts.length > 0 && (
              <div className="mb-10">
                {activeTab === "all" && (
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 22, fontWeight: 700 }}>
                      Chương trình giảm giá
                    </h2>
                    <div className="flex-1 h-px bg-[var(--cafe-border)]" />
                    <span className="font-body text-[var(--cafe-primary)]/50" style={{ fontSize: 13 }}>{discounts.length} chương trình</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {discounts.map((disc) => (
                    <DiscountCard key={disc.discountId} disc={disc}
                      onClick={() => openDetail("discount", disc.discountId)} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {promotions.length === 0 && discounts.length === 0 && (
              <div className="text-center py-24">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--cafe-border)] flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ color: "var(--cafe-primary)", opacity: 0.3 }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <p className="font-heading text-[var(--cafe-primary)]/40" style={{ fontSize: 18, fontWeight: 600 }}>
                  Chưa có chương trình ưu đãi nào
                </p>
                <p className="font-body text-[var(--cafe-primary)]/30 mt-2" style={{ fontSize: 14 }}>
                  Vui lòng quay lại sau để xem các ưu đãi mới nhất!
                </p>
              </div>
            )}

            {activeTab === "promotion" && promotions.length === 0 && (
              <div className="text-center py-16">
                <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 14 }}>Hiện chưa có chương trình khuyến mãi nào</p>
              </div>
            )}

            {activeTab === "discount" && discounts.length === 0 && (
              <div className="text-center py-16">
                <p className="font-body text-[var(--cafe-primary)]/40" style={{ fontSize: 14 }}>Hiện chưa có chương trình giảm giá nào</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading overlay khi mở detail */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-[var(--cafe-primary)]/60" style={{ fontSize: 13 }}>Đang tải chi tiết...</p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && !detailLoading && (
        <DetailModal detail={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
