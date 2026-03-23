import { useState } from "react";
import type { Category } from "../../../services/product.service";

export interface FilterSidebarProps {
  // Danh mục
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (v: string) => void;
  // Loại nước
  selectedDrinkTypes: string[];
  toggleDrinkType: (v: string) => void;
  // Khoảng giá
  selectedPriceRange: string | null;
  setSelectedPriceRange: (v: string | null) => void;
  // Bộ sưu tập
  selectedCollections: string[];
  toggleCollection: (v: string) => void;
  // Thẻ
  selectedTags: string[];
  toggleTag: (v: string) => void;
  // Đánh giá
  selectedRating: number | null;
  setSelectedRating: (v: number | null) => void;
  // Reset all
  onReset: () => void;
}

const DRINK_TYPES = ["Nóng", "Lạnh", "Ít đá", "Không đá", "Ít đường", "Không đường"];

const PRICE_RANGES = [
  "Dưới 30.000đ",
  "30.000đ–50.000đ",
  "50.000đ–70.000đ",
  "70.000đ–100.000đ",
  "Trên 100.000đ",
];

const COLLECTIONS = [
  "Món mới",
  "Bán chạy",
  "Món theo mùa",
  "Best Seller",
  "Combo tiết kiệm",
  "Signature của quán",
];

const TAGS = ["Mới", "Bán chạy", "Giảm giá", "Signature", "Yêu thích", "Giới hạn"];

const RATINGS = [5, 4, 3, 2, 1];

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-3"
    >
      <span
        className="font-body uppercase text-cafe-primary"
        style={{ fontWeight: 700, fontSize: 12, letterSpacing: "1.2px" }}
      >
        {title}
      </span>
      <svg
        width="10"
        height="7"
        viewBox="0 0 10 6"
        fill="none"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s", flexShrink: 0 }}
      >
        <path d="M9.5 5.5L5 0.5L0.500004 5.5" stroke="#30261c" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function FilterSidebar({
  categories,
  activeCategory,
  setActiveCategory,
  selectedDrinkTypes,
  toggleDrinkType,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedCollections,
  toggleCollection,
  selectedTags,
  toggleTag,
  selectedRating,
  setSelectedRating,
  onReset,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    drinkType: true,
    price: false,
    collection: false,
    tags: false,
    rating: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const hasActiveFilters =
    activeCategory !== "Tất cả" ||
    selectedDrinkTypes.length > 0 ||
    selectedPriceRange !== null ||
    selectedCollections.length > 0 ||
    selectedTags.length > 0 ||
    selectedRating !== null;

  return (
    <aside className="flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p
          className="font-body uppercase text-cafe-primary"
          style={{ fontWeight: 700, fontSize: 14, letterSpacing: "1.5px" }}
        >
          Bộ lọc
        </p>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="font-body text-cafe-gold hover:underline"
            style={{ fontWeight: 500, fontSize: 11 }}
          >
            Xóa tất cả
          </button>
        )}
      </div>
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 1. DANH MỤC */}
      <SectionHeader title="Danh mục" open={openSections.category} onToggle={() => toggle("category")} />
      {openSections.category && (
        <div className="flex flex-col gap-1 pb-3">
          <button
            onClick={() => setActiveCategory("Tất cả")}
            className="font-body text-left px-2 py-1.5 rounded transition-all duration-200"
            style={{
              fontWeight: activeCategory === "Tất cả" ? 700 : 400,
              fontSize: 12,
              color: activeCategory === "Tất cả" ? "#30261c" : "rgba(48,38,28,0.6)",
              background: activeCategory === "Tất cả" ? "#e2d9c8" : "transparent",
            }}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat.name)}
              className="font-body text-left px-2 py-1.5 rounded transition-all duration-200"
              style={{
                fontWeight: activeCategory === cat.name ? 700 : 400,
                fontSize: 12,
                color: activeCategory === cat.name ? "#30261c" : "rgba(48,38,28,0.6)",
                background: activeCategory === cat.name ? "#e2d9c8" : "transparent",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 2. LOẠI NƯỚC */}
      <SectionHeader title="Loại nước" open={openSections.drinkType} onToggle={() => toggle("drinkType")} />
      {openSections.drinkType && (
        <div className="flex flex-col gap-2 pb-3">
          {DRINK_TYPES.map((dt) => (
            <label key={dt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDrinkTypes.includes(dt)}
                onChange={() => toggleDrinkType(dt)}
                className="w-4 h-4 cursor-pointer accent-[#30261c]"
              />
              <span
                className="font-body text-cafe-primary"
                style={{ fontWeight: selectedDrinkTypes.includes(dt) ? 600 : 400, fontSize: 12 }}
              >
                {dt}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 3. KHOẢNG GIÁ */}
      <SectionHeader title="Khoảng giá" open={openSections.price} onToggle={() => toggle("price")} />
      {openSections.price && (
        <div className="flex flex-col gap-2 pb-3">
          {PRICE_RANGES.map((pr) => (
            <label key={pr} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price-range"
                checked={selectedPriceRange === pr}
                onChange={() => setSelectedPriceRange(selectedPriceRange === pr ? null : pr)}
                onClick={() => { if (selectedPriceRange === pr) setSelectedPriceRange(null); }}
                className="w-4 h-4 cursor-pointer accent-[#30261c]"
              />
              <span
                className="font-body text-cafe-primary"
                style={{ fontWeight: selectedPriceRange === pr ? 600 : 400, fontSize: 12 }}
              >
                {pr}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 4. BỘ SƯU TẬP */}
      <SectionHeader title="Bộ sưu tập" open={openSections.collection} onToggle={() => toggle("collection")} />
      {openSections.collection && (
        <div className="flex flex-col gap-2 pb-3">
          {COLLECTIONS.map((col) => (
            <label key={col} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCollections.includes(col)}
                onChange={() => toggleCollection(col)}
                className="w-4 h-4 cursor-pointer accent-[#30261c]"
              />
              <span
                className="font-body text-cafe-primary"
                style={{ fontWeight: selectedCollections.includes(col) ? 600 : 400, fontSize: 12 }}
              >
                {col}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 5. THẺ */}
      <SectionHeader title="Thẻ" open={openSections.tags} onToggle={() => toggle("tags")} />
      {openSections.tags && (
        <div className="flex flex-wrap gap-2 pb-3">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="font-body px-3 py-1 border rounded-full transition-all duration-200"
              style={{
                fontWeight: selectedTags.includes(tag) ? 700 : 400,
                fontSize: 11,
                color: selectedTags.includes(tag) ? "#f1f0ee" : "rgba(48,38,28,0.7)",
                background: selectedTags.includes(tag) ? "#30261c" : "transparent",
                borderColor: selectedTags.includes(tag) ? "#30261c" : "#c9c9c9",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="border-t border-dashed border-[#c9c9c9]" />

      {/* 6. ĐÁNH GIÁ */}
      <SectionHeader title="Đánh giá" open={openSections.rating} onToggle={() => toggle("rating")} />
      {openSections.rating && (
        <div className="flex flex-col gap-2 pb-3">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRating(selectedRating === r ? null : r)}
              className="flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-200 text-left"
              style={{
                background: selectedRating === r ? "#e2d9c8" : "transparent",
              }}
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} filled={s <= r} />
                ))}
              </div>
              <span
                className="font-body text-cafe-primary"
                style={{ fontWeight: selectedRating === r ? 700 : 400, fontSize: 12 }}
              >
                {r === 5 ? "5 sao" : `${r} sao trở lên`}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
