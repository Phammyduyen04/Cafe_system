import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { getProductImage, getCategoryName } from "../../../services/product.service";
import type { Product } from "../../../services/product.service";
import { useCart } from "../../../contexts/CartContext";
import { useAuth } from "../../../contexts/AuthContext";

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " \u20ab";
}

interface MenuCardProps {
  item: Product;
}

export default function MenuCard({ item }: MenuCardProps) {
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const categoryName = getCategoryName(item);
  const imageUrl = getProductImage(item);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    setAdding(true);
    try {
      await addToCart({
        productId: item._id,
        size: "M",
        quantity: 1,
        price: item.price,
        name: item.name,
        image: imageUrl,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // silent fail
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/product/${item._id}`}
      className="flex flex-col bg-white rounded-2xl overflow-hidden border border-cafe-accent transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(48,38,28,0.12)] hover:scale-[1.02] cursor-pointer group"
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        <ImageWithFallback
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.tags && item.tags.length > 0 && (
          <span
            className="font-body absolute top-3 left-3 px-2.5 py-1 rounded-full text-white"
            style={{
              fontWeight: 600,
              fontSize: 11,
              background: item.tags[0] === "B\u00e1n ch\u1ea1y" ? "#30261c" : "#c4a35a",
              letterSpacing: "0.5px",
            }}
          >
            {item.tags[0]}
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="font-body bg-white/90 text-cafe-primary px-3 py-1 rounded-full" style={{ fontWeight: 600, fontSize: 12 }}>
              H\u1ebft h\u00e0ng
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <p className="font-body" style={{ fontWeight: 400, fontSize: 11, color: "rgba(48,38,28,0.55)", letterSpacing: "0.5px" }}>
          {categoryName}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-body truncate text-cafe-primary" style={{ fontWeight: 600, fontSize: 14 }}>
            {item.name}
          </p>
          <p className="font-body shrink-0 text-cafe-primary" style={{ fontWeight: 600, fontSize: 14 }}>
            {formatPrice(item.price)}
          </p>
        </div>
        <p className="font-body line-clamp-2" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.65)", lineHeight: 1.5 }}>
          {item.description}
        </p>
        {item.isAvailable && (
          <button
            className="font-body mt-2 w-full py-2 rounded-lg transition-all duration-200"
            style={{
              fontWeight: 600,
              fontSize: 13,
              background: added ? "#4caf50" : "#30261c",
              color: "#f1f0ee",
              opacity: adding ? 0.7 : 1,
            }}
            onClick={handleAddToCart}
            disabled={adding}
          >
            {added ? "\u2713 \u0110\u00e3 th\u00eam" : adding ? "\u0110ang th\u00eam..." : "Th\u00eam v\u00e0o gi\u1ecf"}
          </button>
        )}
      </div>
    </Link>
  );
}
