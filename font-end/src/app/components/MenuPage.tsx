import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { productService, getCategoryName } from "../../services/product.service";
import type { Product, Category } from "../../services/product.service";
import MenuCard from "./menu/MenuCard";
import FilterSidebar from "./menu/FilterSidebar";

export const SIZES = ["S", "M", "L"];
export const FILTER_SECTIONS = ["Danh m\u1ee5c", "Lo\u1ea1i n\u01b0\u1edbc", "Kho\u1ea3ng gi\u00e1", "B\u1ed9 s\u01b0u t\u1eadp", "Th\u1ebb", "\u0110\u00e1nh gi\u00e1"];

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("T\u1ea5t c\u1ea3");
  const [activeTag, setActiveTag] = useState("T\u1ea5t c\u1ea3");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showAvailable, setShowAvailable] = useState(true);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and categories
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prods, cats] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
        ]);
        setProducts(prods);
        setCategories(cats);
      } catch {
        // keep empty arrays
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allCategories = useMemo(() => {
    const names = categories.map(c => c.name);
    return ["T\u1ea5t c\u1ea3", ...names];
  }, [categories]);

  const tagFilters = ["T\u1ea5t c\u1ea3", "B\u00e1n ch\u1ea1y", "\u0110\u1eb7c bi\u1ec7t"];

  // Sync category from URL query param
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    } else {
      setActiveCategory("T\u1ea5t c\u1ea3");
    }
  }, [searchParams]);

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const toggleSection = (s: string) => {
    setOpenSections((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const catName = getCategoryName(item);
      const matchCategory = activeCategory === "T\u1ea5t c\u1ea3" || catName === activeCategory;
      const matchTag = activeTag === "T\u1ea5t c\u1ea3" || (item.tags ?? []).includes(activeTag);
      const matchSearch =
        (item.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (catName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchAvail = (showAvailable && item.isAvailable) || (showOutOfStock && !item.isAvailable);
      return matchCategory && matchTag && matchSearch && matchAvail;
    });
  }, [products, activeCategory, activeTag, searchQuery, showAvailable, showOutOfStock]);

  const availableCount = products.filter(i => i.isAvailable).length;
  const outOfStockCount = products.filter(i => !i.isAvailable).length;

  return (
    <div className="min-h-screen bg-cafe-bg pt-20">
      {/* Breadcrumb + Title */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 pt-8 pb-4">
        <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.66)", letterSpacing: "1px" }}>
          <Link to="/" className="hover:text-cafe-primary transition-colors">Trang ch\u1ee7</Link>
          <span className="text-cafe-primary"> / Th\u1ef1c \u0111\u01a1n</span>
        </p>
        <h1
          className="font-heading mt-1.5 uppercase text-cafe-primary"
          style={{ fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "1px" }}
        >
          Th\u1ef1c \u0111\u01a1n
        </h1>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 pb-16">
        <div className="flex gap-8">

          {/* LEFT SIDEBAR (Desktop) */}
          <div className="hidden lg:block shrink-0 w-[240px]">
            <FilterSidebar
              selectedSizes={selectedSizes}
              toggleSize={toggleSize}
              showAvailable={showAvailable}
              setShowAvailable={setShowAvailable}
              showOutOfStock={showOutOfStock}
              setShowOutOfStock={setShowOutOfStock}
              openSections={openSections}
              toggleSection={toggleSection}
              availableCount={availableCount}
              outOfStockCount={outOfStockCount}
            />
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="flex items-center gap-3 bg-cafe-accent rounded-lg px-4 py-3 w-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#30261c" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" stroke="#30261c" strokeLinecap="round" strokeWidth="2" />
                </svg>
                <input
                  type="text"
                  placeholder="T\u00ecm ki\u1ebfm th\u1ee9c u\u1ed1ng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-body bg-transparent outline-none flex-1 text-cafe-primary placeholder-cafe-primary/50"
                  style={{ fontWeight: 400, fontSize: 13, letterSpacing: "1.5px" }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-cafe-primary/50 hover:text-cafe-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-3 flex items-center justify-between">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="font-body flex items-center gap-2 px-4 py-2 border border-cafe-primary rounded-lg text-cafe-primary"
                style={{ fontWeight: 700, fontSize: 13, letterSpacing: "1.5px" }}
              >
                <svg width="18" height="13" viewBox="0 0 27.5 17.5" fill="none">
                  <path d="M26.75 0.75H0.75" stroke="#30261c" strokeLinecap="round" strokeWidth="1.5" />
                  <path d="M18.75 8.75H0.75" stroke="#30261c" strokeLinecap="round" strokeWidth="1.5" />
                  <path d="M13.75 16.75H0.75" stroke="#30261c" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
                B\u1ed9 l\u1ecdc
                <svg
                  width="10" height="7" viewBox="0 0 10 6" fill="none"
                  style={{ transform: mobileSidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }}
                >
                  <path d="M9.5 5.5L5 0.5L0.500004 5.5" stroke="#30261c" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.6)" }}>
                {filtered.length} m\u00f3n
              </p>
            </div>

            {mobileSidebarOpen && (
              <div className="lg:hidden bg-white border border-cafe-accent rounded-2xl p-5 mb-4">
                <FilterSidebar
                  selectedSizes={selectedSizes}
                  toggleSize={toggleSize}
                  showAvailable={showAvailable}
                  setShowAvailable={setShowAvailable}
                  showOutOfStock={showOutOfStock}
                  setShowOutOfStock={setShowOutOfStock}
                  openSections={openSections}
                  toggleSection={toggleSection}
                  availableCount={availableCount}
                  outOfStockCount={outOfStockCount}
                />
              </div>
            )}

            {/* Category Tags - Row 1 */}
            <div className="mb-1 overflow-x-auto">
              <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                {allCategories.slice(0, Math.ceil(allCategories.length / 2)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="font-body px-4 py-1.5 border transition-all duration-200 whitespace-nowrap"
                    style={{
                      fontWeight: activeCategory === cat ? 700 : 400,
                      fontSize: 11,
                      color: activeCategory === cat ? "#30261c" : "rgba(48,38,28,0.6)",
                      borderColor: activeCategory === cat ? "#30261c" : "#a3a3a3",
                      borderRadius: 3,
                      background: activeCategory === cat ? "#e2d9c8" : "transparent",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {/* Category Tags - Row 2 */}
            <div className="mb-4 overflow-x-auto">
              <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
                {[...allCategories.slice(Math.ceil(allCategories.length / 2)), ...tagFilters.filter(t => t !== "T\u1ea5t c\u1ea3")].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (tagFilters.includes(cat)) {
                        setActiveTag(cat);
                      } else {
                        setActiveCategory(cat);
                      }
                    }}
                    className="font-body px-4 py-1.5 border transition-all duration-200 whitespace-nowrap"
                    style={{
                      fontWeight: (activeCategory === cat || activeTag === cat) ? 700 : 400,
                      fontSize: 11,
                      color: (activeCategory === cat || activeTag === cat) ? "#30261c" : "rgba(48,38,28,0.6)",
                      borderColor: (activeCategory === cat || activeTag === cat) ? "#30261c" : "#a3a3a3",
                      borderRadius: 3,
                      background: (activeCategory === cat || activeTag === cat) ? "#e2d9c8" : "transparent",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop result count */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.6)" }}>
                Hi\u1ec3n th\u1ecb <span className="text-cafe-primary" style={{ fontWeight: 700 }}>{filtered.length}</span> m\u00f3n
              </p>
              {(activeCategory !== "T\u1ea5t c\u1ea3" || activeTag !== "T\u1ea5t c\u1ea3" || searchQuery || selectedSizes.length > 0) && (
                <button
                  onClick={() => { setActiveCategory("T\u1ea5t c\u1ea3"); setActiveTag("T\u1ea5t c\u1ea3"); setSearchQuery(""); setSelectedSizes([]); }}
                  className="font-body text-cafe-gold hover:underline transition-all"
                  style={{ fontWeight: 500, fontSize: 12 }}
                >
                  X\u00f3a b\u1ed9 l\u1ecdc
                </button>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {[1,2,3,4,5,6].map(n => (
                  <div key={n} className="bg-white rounded-2xl overflow-hidden border border-cafe-accent animate-pulse">
                    <div className="h-[200px] bg-cafe-accent" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-3 bg-cafe-accent rounded w-1/3" />
                      <div className="h-4 bg-cafe-accent rounded w-2/3" />
                      <div className="h-3 bg-cafe-accent rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {filtered.map((item) => (
                  <MenuCard key={item._id} item={item} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9c9c9" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <p className="font-body" style={{ fontWeight: 400, fontSize: 14, color: "rgba(48,38,28,0.5)" }}>
                  {products.length === 0 ? "Ch\u01b0a c\u00f3 s\u1ea3n ph\u1ea9m n\u00e0o" : "Kh\u00f4ng t\u00ecm th\u1ea5y m\u00f3n ph\u00f9 h\u1ee3p"}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={() => { setActiveCategory("T\u1ea5t c\u1ea3"); setActiveTag("T\u1ea5t c\u1ea3"); setSearchQuery(""); setSelectedSizes([]); }}
                    className="font-body px-5 py-2 bg-cafe-primary text-white rounded-full hover:bg-cafe-dark transition-colors"
                    style={{ fontWeight: 500, fontSize: 13 }}
                  >
                    Xem t\u1ea5t c\u1ea3
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
