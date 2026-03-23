import { Link, useNavigate } from "react-router";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { resolveImageUrl, DEFAULT_PRODUCT_IMAGE } from "../../services/product.service";

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function CartPage() {
  const { items, cartCount, loading, updateItem, removeItem } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-cafe-bg">
        <p className="font-body text-cafe-primary" style={{ fontSize: 16, fontWeight: 600 }}>
          Bạn cần đăng nhập để xem giỏ hàng
        </p>
        <Link to="/login" className="font-body px-6 py-3 bg-cafe-primary text-cafe-bg" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2px" }}>
          ĐĂNG NHẬP
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-cafe-bg pt-20">
      <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="text-cafe-primary hover:opacity-60 transition-opacity" aria-label="Quay lại">
            <svg width="36" height="12" viewBox="0 0 36 12" fill="none">
              <path d="M35 6H1M1 6L6 1M1 6L6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-body text-cafe-primary" style={{ fontSize: 28, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
            Giỏ hàng {cartCount > 0 && <span style={{ fontSize: 16, color: "rgba(48,38,28,0.45)", fontWeight: 400 }}>({cartCount} sản phẩm)</span>}
          </h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-cafe-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center gap-5 py-20">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(48,38,28,0.25)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L23 6H6" />
            </svg>
            <p className="font-body text-cafe-primary" style={{ fontSize: 15, fontWeight: 600 }}>Giỏ hàng trống</p>
            <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.5)" }}>Thêm sản phẩm vào giỏ để tiến hành đặt hàng</p>
            <Link
              to="/menu"
              className="font-body px-8 py-3 bg-cafe-primary text-cafe-bg"
              style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}
            >
              Xem thực đơn
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left: Items list */}
            <div className="flex-1 min-w-0">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 pb-3 border-b border-cafe-border">
                {["Sản phẩm", "Đơn giá", "Số lượng", ""].map(h => (
                  <span key={h} className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(48,38,28,0.45)" }}>{h}</span>
                ))}
              </div>

              <div className="flex flex-col divide-y divide-cafe-border">
                {items.map(item => {
                  const imgUrl = item.image ? resolveImageUrl(item.image) : DEFAULT_PRODUCT_IMAGE;
                  return (
                    <div key={item.itemId} className="py-5 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">

                      {/* Product info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 shrink-0 overflow-hidden border border-cafe-border">
                          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.5px" }}>
                            {item.name}
                          </p>
                          {item.size && (
                            <span className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.5)" }}>
                              Size: {item.size}
                            </span>
                          )}
                          {/* Mobile price */}
                          <span className="font-body text-cafe-primary md:hidden" style={{ fontSize: 13, fontWeight: 600 }}>
                            {formatVND(item.price)}
                          </span>
                        </div>
                      </div>

                      {/* Unit price (desktop) */}
                      <span className="font-body text-cafe-primary hidden md:block" style={{ fontSize: 13 }}>
                        {formatVND(item.price)}
                      </span>

                      {/* Quantity control */}
                      <div className="flex items-center border border-cafe-border w-fit">
                        <button
                          onClick={() => {
                            if (item.quantity <= 1) removeItem(item.itemId);
                            else updateItem(item.itemId, item.quantity - 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-cafe-primary hover:bg-cafe-accent transition-colors"
                          style={{ fontSize: 16 }}
                          aria-label="Giảm"
                        >−</button>
                        <span className="font-body w-9 text-center text-cafe-primary" style={{ fontSize: 13, fontWeight: 500 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.itemId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-cafe-primary hover:bg-cafe-accent transition-colors"
                          style={{ fontSize: 16 }}
                          aria-label="Tăng"
                        >+</button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.itemId)}
                        className="text-cafe-primary hover:opacity-50 transition-opacity p-1"
                        aria-label="Xoá"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              <Link
                to="/menu"
                className="font-body inline-flex items-center gap-2 mt-4 text-cafe-primary hover:opacity-60 transition-opacity"
                style={{ fontSize: 12, letterSpacing: "1px" }}
              >
                <svg width="28" height="10" viewBox="0 0 28 10" fill="none">
                  <path d="M27 5H1M1 5L5 1M1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tiếp tục mua sắm
              </Link>
            </div>

            {/* Right: Order summary */}
            <div className="w-full lg:w-[320px] shrink-0 border border-cafe-border p-6 flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
              <p className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}>
                Tóm tắt đơn hàng
              </p>

              <div className="flex flex-col gap-2">
                {items.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between gap-2">
                    <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.7)" }}>
                      {item.name} {item.size && `(${item.size})`} × {item.quantity}
                    </span>
                    <span className="font-body text-cafe-primary shrink-0" style={{ fontSize: 12, fontWeight: 500 }}>
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-cafe-border" />

              <div className="flex items-center justify-between">
                <span className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>Tạm tính</span>
                <span className="font-body text-cafe-primary" style={{ fontSize: 15, fontWeight: 700 }}>{formatVND(subtotal)}</span>
              </div>

              <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>
                Phí vận chuyển sẽ được tính ở bước tiếp theo
              </p>

              <button
                onClick={() => navigate("/checkout")}
                className="font-body w-full flex items-center justify-between px-5 py-4 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98]"
                style={{ minWidth: 0 }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}>
                  Đặt hàng
                </span>
                <svg width="28" height="10" viewBox="0 0 48 10" fill="none">
                  <line x1="0" y1="5" x2="40" y2="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M38 1L44 5L38 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
