import { useState, useEffect } from "react";
import { productService } from "../../../services/product.service";
import type { Review } from "../../../services/product.service";

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width="13" height="13" viewBox="0 0 24 24"
          fill={value >= s ? "#f5b731" : "none"}
          stroke="#f5b731" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

type Tab = "all" | "product" | "store";

export default function ManagerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await productService.getAllReviews();
      setReviews(res);
    } catch {
      setError("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: Review) => {
    setDeletingId(review.reviewId);
    try {
      await productService.deleteReview(review.reviewId);
      setReviews(prev => prev.filter(r => r.reviewId !== review.reviewId));
    } catch {
      alert("Không thể xóa đánh giá. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const filtered = reviews.filter(r => {
    const matchTab =
      tab === "all" ||
      (tab === "product" && r.productId) ||
      (tab === "store" && !r.productId);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.customerName.toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : "—";
  const storeCount = reviews.filter(r => !r.productId).length;
  const productCount = reviews.filter(r => r.productId).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
          Quản lý đánh giá
        </h1>
        <p className="font-body mt-1" style={{ fontSize: 13, color: "rgba(48,38,28,0.5)" }}>
          Xem và quản lý đánh giá từ khách hàng
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng đánh giá", value: totalReviews },
          { label: "Điểm trung bình", value: avgRating },
          { label: "Đánh giá cửa hàng", value: storeCount },
          { label: "Đánh giá sản phẩm", value: productCount },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[var(--cafe-border)] p-5">
            <p className="font-body" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>
              {stat.label}
            </p>
            <p className="font-body text-[var(--cafe-primary)] mt-1" style={{ fontSize: 26, fontWeight: 700 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[var(--cafe-border)] p-5 mb-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1">
          {(["all", "product", "store"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="font-body px-4 py-2 transition-colors"
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "1px",
                background: tab === t ? "var(--cafe-primary)" : "transparent",
                color: tab === t ? "#f1f0ee" : "rgba(48,38,28,0.6)",
                border: "1px solid",
                borderColor: tab === t ? "var(--cafe-primary)" : "rgba(48,38,28,0.2)",
              }}
            >
              {t === "all" ? "Tất cả" : t === "product" ? "Sản phẩm" : "Cửa hàng"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, nội dung..."
          className="font-body border border-[var(--cafe-border)] px-3 py-2 outline-none focus:border-[var(--cafe-primary)] w-full sm:w-64"
          style={{ fontSize: 13 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--cafe-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="font-body text-red-500" style={{ fontSize: 13 }}>{error}</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[var(--cafe-border)] flex items-center justify-center py-16">
          <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.4)" }}>Không có đánh giá nào</p>
        </div>
      ) : (
        <div className="bg-white border border-[var(--cafe-border)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--cafe-border)]">
                {["Khách hàng", "Loại", "Sao", "Nội dung", "Ngày", ""].map(h => (
                  <th key={h} className="font-body text-left px-4 py-3" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(48,38,28,0.45)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(review => (
                <tr key={review.reviewId} className="border-b border-[var(--cafe-border)] last:border-0 hover:bg-[#fdf9f3] transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {review.avatar ? (
                        <img src={review.avatar} alt={review.customerName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--cafe-border)] shrink-0 flex items-center justify-center font-body text-[var(--cafe-primary)]" style={{ fontSize: 12, fontWeight: 700 }}>
                          {review.customerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-body text-[var(--cafe-primary)]" style={{ fontSize: 13, fontWeight: 600 }}>
                        {review.customerName}
                      </span>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className="font-body px-2 py-1" style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      background: review.productId ? "#eff6ff" : "#f0fdf4",
                      color: review.productId ? "#3b82f6" : "#16a34a",
                    }}>
                      {review.productId ? "Sản phẩm" : "Cửa hàng"}
                    </span>
                  </td>
                  {/* Rating */}
                  <td className="px-4 py-3">
                    <StarDisplay value={review.rating} />
                  </td>
                  {/* Comment */}
                  <td className="px-4 py-3" style={{ maxWidth: 300 }}>
                    <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.7)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {review.comment}
                    </p>
                  </td>
                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.45)" }}>
                      {review.createdAt ? formatDate(review.createdAt) : "—"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmDelete(review)}
                      className="font-body px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <p className="font-body text-[var(--cafe-primary)] mb-2" style={{ fontSize: 15, fontWeight: 700 }}>
              Xóa đánh giá
            </p>
            <p className="font-body mb-1" style={{ fontSize: 13, color: "rgba(48,38,28,0.7)" }}>
              Đánh giá của <strong>{confirmDelete.customerName}</strong>:
            </p>
            <p className="font-body mb-5 italic" style={{ fontSize: 13, color: "rgba(48,38,28,0.5)" }}>
              "{confirmDelete.comment}"
            </p>
            <p className="font-body mb-6" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)" }}>
              Hành động này không thể hoàn tác. Bạn có chắc muốn xóa?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="font-body px-4 py-2 border border-[var(--cafe-border)] text-[var(--cafe-primary)] hover:bg-[var(--cafe-bg)] transition-colors"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.reviewId}
                className="font-body px-4 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {deletingId === confirmDelete.reviewId ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
