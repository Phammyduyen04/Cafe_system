import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { productService, getProductImage, getCategoryName } from "../../services/product.service";
import type { Product, Category, Review } from "../../services/product.service";
import { orderService } from "../../services/order.service";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ category, name }: { category: string; name: string }) {
  return (
    <nav className="font-body flex items-center gap-2 mb-6 md:mb-8" style={{ fontSize: 13, color: "rgba(48,38,28,0.55)" }}>
      <Link to="/" className="hover:text-cafe-primary transition-colors">Trang chủ</Link>
      <span>/</span>
      <Link to="/menu" className="hover:text-cafe-primary transition-colors">Thực đơn</Link>
      <span>/</span>
      <Link to={`/menu?category=${encodeURIComponent(category)}`} className="hover:text-cafe-primary transition-colors">{category}</Link>
      <span>/</span>
      <span className="text-cafe-primary">{name}</span>
    </nav>
  );
}

// ─── Product Detail Page ───────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [mainImg, setMainImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [commentText, setCommentText] = useState("");
  const [commentRating, setCommentRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      productService.getProduct(slug),
      productService.getCategories(),
    ]).then(([p, cats]) => {
      if (!p) setNotFound(true);
      else {
        setProduct(p);
        productService.getProductReviews(p._id).then(setReviews).catch(() => {});
        // Check if user has a completed order with this product
        if (isLoggedIn) {
          orderService.getMyOrders()
            .then(res => {
              const orders: any[] = Array.isArray(res) ? res : ((res as any)?.data ?? []);
              const bought = orders.some(o =>
                o.status === 'COMPLETED' &&
                (o.order_details ?? o.items ?? []).some(
                  (d: any) => (d.product_id ?? d.productId) === p._id
                )
              );
              setCanReview(bought);
            })
            .catch(() => {});
        }
      }
      setCategories(cats);
    }).finally(() => setLoading(false));
  }, [slug]);

  const handleAdd = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      const sizes = product.sizes ?? [];
      const sizeLabel = sizes[selectedSize]?.label ?? "M";
      const imageUrl = getProductImage(product);
      await addToCart({
        productId: product._id,
        size: sizeLabel,
        quantity,
        price: product.price,
        name: product.name,
        image: imageUrl,
      });
      navigate("/cart");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
      setAdding(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !product) return;
    setSubmittingReview(true);
    try {
      const newReview = await productService.createReview({
        customerName: user?.username ?? "Khách",
        rating: commentRating,
        comment: commentText.trim(),
        productId: product._id,
      });
      setReviews(prev => [newReview, ...prev]);
      setCommentText("");
      setCommentRating(5);
    } catch {
      // silent fail
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-cafe-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cafe-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)" }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  // ─── Not Found ───
  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-cafe-bg flex flex-col items-center justify-center gap-4 px-6">
        <p className="font-body text-cafe-primary" style={{ fontSize: 22, fontWeight: 700 }}>Sản phẩm không tồn tại</p>
        <Link to="/menu" className="font-body px-6 py-3 bg-cafe-primary text-white" style={{ fontSize: 13 }}>
          Về thực đơn
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [getProductImage(product)];
  const sizes = product.sizes ?? [{ label: "S" }, { label: "M" }, { label: "L" }];
  const categoryName = getCategoryName(product, categories);

  return (
    <div className="min-h-screen bg-cafe-bg">
      {/* ── Desktop Layout ── */}
      <div className="hidden md:block max-w-[1300px] mx-auto px-8 py-10">
        <Breadcrumb category={categoryName} name={product.name} />

        <div className="flex gap-8 items-start">
          {/* Image Column */}
          <div className="flex gap-3 flex-1">
            {/* Thumbnail strip */}
            <div className="flex flex-col gap-2 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImg(i)}
                  className="w-[64px] h-[78px] border overflow-hidden transition-all duration-200 shrink-0"
                  style={{
                    borderColor: i === mainImg ? "var(--cafe-primary)" : "#d9d9d9",
                    borderWidth: i === mainImg ? 2 : 1,
                  }}
                  aria-label={`Ảnh ${i + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" style={{ opacity: i === mainImg ? 1 : 0.55 }} />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="flex-1 relative overflow-hidden" style={{ aspectRatio: "3/4", maxHeight: 430 }}>
              <img
                key={mainImg}
                src={images[mainImg]}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{ animation: "imgFadeIn 0.3s ease" }}
              />
            </div>
          </div>

          {/* Info Card */}
          <div
            className="w-[340px] shrink-0 border border-cafe-border flex flex-col"
            style={{ backgroundColor: "rgba(255,255,255,0.55)", minHeight: 500 }}
          >
            <div className="p-8 flex flex-col gap-5 flex-1">
              {/* Name & Price */}
              <div className="flex flex-col gap-1">
                <h1 className="font-body text-cafe-primary uppercase tracking-[1px]" style={{ fontWeight: 600, fontSize: 15 }}>
                  {product.name}
                </h1>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-body text-[rgba(48,38,28,0.55)]" style={{ fontWeight: 400, fontSize: 12, letterSpacing: "0.5px" }}>
                    Đã bao gồm thuế VAT
                  </p>
                  <p className="font-body text-cafe-primary" style={{ fontWeight: 600, fontSize: 15, letterSpacing: "0.5px" }}>
                    {product.price.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>

              <div className="h-px bg-cafe-border" />

              {/* Description */}
              <p className="font-body text-cafe-primary leading-relaxed" style={{ fontWeight: 400, fontSize: 12, letterSpacing: "0.5px" }}>
                {product.description}
              </p>

              <div className="h-px bg-cafe-border" />

              {/* Cup size */}
              <div className="flex flex-col gap-3">
                <p className="font-body text-cafe-primary uppercase tracking-[2px]" style={{ fontWeight: 300, fontSize: 12 }}>
                  Kích cỡ
                </p>
                <div className="flex gap-2">
                  {sizes.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedSize(i)}
                      className="border transition-all duration-150 flex items-center justify-center"
                      style={{
                        width: 52,
                        height: 36,
                        borderColor: i === selectedSize ? "var(--cafe-primary)" : "#a3a3a3",
                        borderWidth: i === selectedSize ? 1.5 : 1,
                        background: i === selectedSize ? "var(--cafe-primary)" : "transparent",
                      }}
                      aria-label={s.label}
                    >
                      <span className="font-body" style={{ fontWeight: 500, fontSize: 11, color: i === selectedSize ? "var(--cafe-bg)" : "var(--cafe-primary)" }}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-cafe-border" />

              {/* Quantity */}
              <div className="flex flex-col gap-3">
                <p className="font-body text-cafe-primary uppercase tracking-[2px]" style={{ fontWeight: 300, fontSize: 12 }}>
                  Số lượng
                </p>
                <div className="flex items-center gap-0 border border-cafe-border w-fit">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="font-body w-9 h-9 flex items-center justify-center text-cafe-primary hover:bg-cafe-accent transition-colors"
                    style={{ fontSize: 18 }}
                    aria-label="Giảm"
                  >−</button>
                  <span className="font-body w-10 text-center text-cafe-primary" style={{ fontWeight: 500, fontSize: 13 }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="font-body w-9 h-9 flex items-center justify-center text-cafe-primary hover:bg-cafe-accent transition-colors"
                    style={{ fontSize: 18 }}
                    aria-label="Tăng"
                  >+</button>
                </div>
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={adding || !product.isAvailable}
              className="font-body w-full flex items-center justify-center py-3 transition-all duration-200 hover:brightness-90 active:scale-[0.98] mt-auto disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: added ? "#5c3317" : "var(--cafe-primary)",
                fontWeight: 600,
                fontSize: 13,
                color: "var(--cafe-bg)",
                letterSpacing: "2px",
              }}
            >
              {!product.isAvailable ? "HẾT HÀNG" : added ? "ĐÃ THÊM VÀO GIỎ ✓" : adding ? "ĐANG THÊM..." : "ĐẶT NGAY!"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Layout ── */}
      <div className="md:hidden flex flex-col pb-24">
        <div className="px-5 pt-5 pb-3">
          <Link to="/menu" className="font-body flex items-center gap-2 text-cafe-primary" style={{ fontSize: 13 }}>
            <svg width="36" height="12" viewBox="0 0 36 12" fill="none">
              <path d="M35 6H1M1 6L6 1M1 6L6 11" stroke="var(--cafe-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="w-full relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
          <img key={mainImg} src={images[mainImg]} alt={product.name} className="w-full h-full object-cover" style={{ animation: "imgFadeIn 0.3s ease" }} />
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setMainImg(i)}
              className="shrink-0 overflow-hidden border"
              style={{ width: 64, height: 78, borderColor: i === mainImg ? "var(--cafe-primary)" : "#d9d9d9", borderWidth: i === mainImg ? 2 : 1, opacity: i === mainImg ? 1 : 0.55 }}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="px-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-body text-cafe-primary uppercase tracking-[1px]" style={{ fontWeight: 600, fontSize: 15 }}>
                {product.name}
              </h1>
              <p className="font-body text-[rgba(48,38,28,0.55)]" style={{ fontWeight: 400, fontSize: 11, letterSpacing: "0.5px" }}>
                Đã bao gồm thuế VAT
              </p>
            </div>
            <p className="font-body text-cafe-primary shrink-0" style={{ fontWeight: 600, fontSize: 16 }}>
              {product.price.toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <p className="font-body text-cafe-primary leading-relaxed" style={{ fontWeight: 400, fontSize: 12, letterSpacing: "0.5px" }}>
            {product.description}
          </p>

          <div className="h-px bg-cafe-border" />

          <div className="flex flex-col gap-3">
            <p className="font-body text-cafe-primary uppercase tracking-[2px]" style={{ fontWeight: 300, fontSize: 12 }}>
              Kích cỡ
            </p>
            <div className="flex gap-2">
              {sizes.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSize(i)}
                  className="border flex items-center justify-center transition-all duration-150"
                  style={{
                    width: 52, height: 36,
                    borderColor: i === selectedSize ? "var(--cafe-primary)" : "#a3a3a3",
                    borderWidth: i === selectedSize ? 1.5 : 1,
                    background: i === selectedSize ? "var(--cafe-primary)" : "transparent",
                  }}
                >
                  <span className="font-body" style={{ fontWeight: 500, fontSize: 11, color: i === selectedSize ? "var(--cafe-bg)" : "var(--cafe-primary)" }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Add button */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-cafe-border bg-cafe-bg">
          <button
            onClick={handleAdd}
            disabled={adding || !product.isAvailable}
            className="font-body w-full py-4 flex items-center justify-center transition-all duration-200 disabled:opacity-60"
            style={{
              background: added ? "#5c3317" : "var(--cafe-accent)",
              fontWeight: 600,
              fontSize: 13,
              color: added ? "var(--cafe-bg)" : "var(--cafe-primary)",
              letterSpacing: "2px",
            }}
          >
            {!product.isAvailable ? "HẾT HÀNG" : added ? "ĐÃ THÊM VÀO GIỎ ✓" : adding ? "ĐANG THÊM..." : "ĐẶT NGAY!"}
          </button>
        </div>
      </div>

      {/* ── Comments Section ── */}
      <div className="max-w-[1300px] mx-auto px-8 py-12">
        <div className="h-px bg-cafe-border mb-10" />

        <div className="flex items-end gap-6 mb-8">
          <h2 className="font-body text-cafe-primary uppercase tracking-[3px]" style={{ fontWeight: 600, fontSize: 14 }}>
            Đánh giá
          </h2>
          <div className="flex items-center gap-2">
            <span className="font-body text-cafe-primary" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{avgRating}</span>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={parseFloat(avgRating) >= s ? "#f5b731" : "none"} stroke="#f5b731" strokeWidth="1.5">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
              ))}
            </div>
            <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>({reviews.length} đánh giá)</span>
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            {reviews.length === 0 && (
              <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.45)" }}>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            )}
            {reviews.map(r => {
              const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString("vi-VN") : "";
              return (
                <div key={r.reviewId} className="border-b border-[#e8e4de] pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-cafe-primary">
                        <span className="font-body" style={{ fontSize: 12, color: "var(--cafe-bg)", fontWeight: 600 }}>{r.customerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>{r.customerName}</span>
                    </div>
                    <span className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>{date}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2 ml-11">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill={r.rating >= s ? "#f5b731" : "none"} stroke="#f5b731" strokeWidth="1.5">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                      </svg>
                    ))}
                  </div>
                  <p className="font-body ml-11" style={{ fontSize: 13, color: "rgba(48,38,28,0.8)", lineHeight: 1.7 }}>{r.comment}</p>
                </div>
              );
            })}
          </div>

          {!isLoggedIn ? (
            <div className="w-full border border-cafe-border p-6 flex flex-col items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
              <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>Đăng nhập để xem và gửi đánh giá</p>
              <Link to="/login" className="font-body px-6 py-2.5 bg-cafe-primary text-cafe-bg" style={{ fontSize: 12, letterSpacing: "2px", fontWeight: 600 }}>ĐĂNG NHẬP</Link>
            </div>
          ) : !canReview ? (
            <div className="w-full border border-cafe-border p-6 flex flex-col items-center gap-2" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
              <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600 }}>Bạn chưa thể đánh giá sản phẩm này</p>
              <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.55)", textAlign: "center" }}>
                Hãy đặt hàng và nhận sản phẩm để có thể gửi đánh giá.
              </p>
              <Link to="/menu" className="font-body mt-1 px-5 py-2 border border-cafe-primary text-cafe-primary" style={{ fontSize: 11, letterSpacing: "1.5px", fontWeight: 600 }}>ĐẶT HÀNG NGAY</Link>
            </div>
          ) : (
            <div className="w-full border border-cafe-border p-6 flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.55)" }}>
              <p className="font-body text-cafe-primary uppercase tracking-[2px]" style={{ fontWeight: 600, fontSize: 12 }}>
                Viết đánh giá
              </p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setCommentRating(s)}
                    className="transition-transform hover:scale-110"
                    aria-label={`${s} sao`}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={(hoverRating || commentRating) >= s ? "#f5b731" : "none"} stroke="#f5b731" strokeWidth="1.5">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </button>
                ))}
              </div>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn..."
                rows={4}
                className="font-body w-full resize-none border border-cafe-border bg-transparent p-3 outline-none focus:border-cafe-primary transition-colors text-cafe-primary placeholder:text-[rgba(48,38,28,0.35)]"
                style={{ fontSize: 12 }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submittingReview}
                className="font-body w-full py-3 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontWeight: 600, fontSize: 12, letterSpacing: "2px" }}
              >
                {submittingReview ? "ĐANG GỬI..." : "GỬI ĐÁNH GIÁ"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes imgFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
