import { Link } from "react-router";
import { getProductImage, getCategoryName } from "../../../services/product.service";
import type { Product, Category } from "../../../services/product.service";

// ─── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ filled }: { filled: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={i <= filled ? "#FFB921" : "#CECECE"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " ₫";
}

// ─── Product Card ──────────────────────────────────────────────────────────────
export default function ProductCard({ product, categories }: { product: Product; categories?: Category[] }) {
  const imageUrl = getProductImage(product);
  const categoryName = getCategoryName(product, categories);

  return (
    <div className="bg-[rgba(226,217,200,0.2)] border border-cafe-accent rounded-[18px] p-4 flex flex-col shrink-0 w-[260px] sm:w-[280px] md:w-[300px] transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[rgba(48,38,28,0.15)] hover:border-[#c4b49a] cursor-pointer" style={{ height: 420 }}>
      <div className="relative rounded-[12px] overflow-hidden shrink-0" style={{ height: 220 }}>
        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover rounded-[12px]" />
        {categoryName && (
          <span
            className="font-body absolute top-3 left-3 px-2.5 py-1 rounded-full text-white bg-cafe-primary/80"
            style={{ fontWeight: 600, fontSize: 10, letterSpacing: "0.5px" }}
          >
            {categoryName}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 gap-2 pt-3">
        <p className="font-alt text-cafe-primary" style={{ fontWeight: 600, fontSize: 22 }}>{product.name}</p>
        <p className="font-alt flex-1 text-cafe-dark line-clamp-2" style={{ fontWeight: 400, fontSize: 14, lineHeight: 1.5 }}>{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-body text-cafe-dark" style={{ fontWeight: 600, fontSize: 16 }}>{formatPrice(product.price)}</span>
          <Link
            to={`/product/${product._id}`}
            className="font-body bg-cafe-dark text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-[#3d0000] transition-colors"
            style={{ fontWeight: 500, fontSize: 13 }}
          >
            Đặt ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
