import { SIZES, FILTER_SECTIONS } from "../MenuPage";

export interface FilterSidebarProps {
  selectedSizes: string[];
  toggleSize: (s: string) => void;
  showAvailable: boolean;
  setShowAvailable: (v: boolean) => void;
  showOutOfStock: boolean;
  setShowOutOfStock: (v: boolean) => void;
  openSections: string[];
  toggleSection: (s: string) => void;
  availableCount: number;
  outOfStockCount: number;
}

export default function FilterSidebar({
  selectedSizes,
  toggleSize,
  showAvailable,
  setShowAvailable,
  showOutOfStock,
  setShowOutOfStock,
  openSections,
  toggleSection,
  availableCount,
  outOfStockCount,
}: FilterSidebarProps) {
  return (
    <aside className="flex flex-col gap-0 w-full">
      <p className="font-body mb-4 uppercase text-cafe-primary" style={{ fontWeight: 700, fontSize: 15, letterSpacing: "1.5px" }}>
        B\u1ed9 l\u1ecdc
      </p>
      <div className="border-t border-dashed border-[#c9c9c9] mb-4" />

      {/* K\u00edch c\u1ee1 */}
      <p className="font-body mb-3 uppercase text-cafe-primary" style={{ fontWeight: 700, fontSize: 13, letterSpacing: "1px" }}>
        K\u00edch c\u1ee1
      </p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => toggleSize(s)}
            className="font-body w-9 h-9 flex items-center justify-center border transition-all duration-200"
            style={{
              fontWeight: 500,
              fontSize: 12,
              color: selectedSizes.includes(s) ? "#f1f0ee" : "#30261c",
              background: selectedSizes.includes(s) ? "#30261c" : "transparent",
              borderColor: selectedSizes.includes(s) ? "#30261c" : "#a3a3a3",
              borderRadius: 4,
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="border-t border-dashed border-[#c9c9c9] mb-4" />

      {/* T\u00ecnh tr\u1ea1ng */}
      <div className="mb-1">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body uppercase text-cafe-primary" style={{ fontWeight: 700, fontSize: 13, letterSpacing: "1px" }}>
            T\u00ecnh tr\u1ea1ng
          </p>
          <svg width="10" height="7" viewBox="0 0 10 6" fill="none">
            <path d="M9.5 5.5L5 0.5L0.500004 5.5" stroke="#30261c" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-2 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAvailable}
              onChange={(e) => setShowAvailable(e.target.checked)}
              className="w-5 h-5 border border-[#a3a3a3] rounded-sm cursor-pointer accent-[#30261c]"
            />
            <span className="font-body text-cafe-primary" style={{ fontWeight: 400, fontSize: 12 }}>
              C\u00f2n h\u00e0ng{" "}
              <span style={{ color: "#000e8a", fontWeight: 700 }}>({availableCount})</span>
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="w-5 h-5 border border-[#a3a3a3] rounded-sm cursor-pointer accent-[#30261c]"
            />
            <span className="font-body text-cafe-primary" style={{ fontWeight: 400, fontSize: 12 }}>
              H\u1ebft h\u00e0ng{" "}
              <span style={{ color: "#000e8a", fontWeight: 700 }}>({outOfStockCount})</span>
            </span>
          </label>
        </div>
      </div>
      <div className="border-t border-dashed border-[#c9c9c9] mb-1" />

      {FILTER_SECTIONS.map((section) => (
        <div key={section}>
          <button
            className="flex items-center justify-between w-full py-3"
            onClick={() => toggleSection(section)}
          >
            <p className="font-body uppercase text-cafe-primary" style={{ fontWeight: 700, fontSize: 13, letterSpacing: "1px" }}>
              {section}
            </p>
            <svg
              width="10" height="7" viewBox="0 0 10 6" fill="none"
              style={{ transform: openSections.includes(section) ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }}
            >
              <path d="M9.5 5.5L5 0.5L0.500004 5.5" stroke="#30261c" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="border-t border-dashed border-[#c9c9c9]" />
        </div>
      ))}
    </aside>
  );
}
