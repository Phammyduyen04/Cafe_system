import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { productService, getCategoryName } from "../../services/product.service";
import type { Product, Category } from "../../services/product.service";
import MenuCard from "./menu/MenuCard";
import FilterSidebar from "./menu/FilterSidebar";

function priceInRange(price: number, range: string | null): boolean {
  if (!range) return true;
  if (range === "Dưới 30.000đ") return price < 30000;
  if (range === "30.000đ–50.000đ") return price >= 30000 && price <= 50000;
  if (range === "50.000đ–70.000đ") return price > 50000 && price <= 70000;
  if (range === "70.000đ–100.000đ") return price > 70000 && price <= 100000;
  if (range === "Trên 100.000đ") return price > 100000;
  return true;
}

const ITEMS_PER_PAGE = 9;

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [selectedDrinkTypes, setSelectedDrinkTypes] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Sync category from URL query param
  useEffect(() => {
    const cat = searchParams.get("category");
    setActiveCategory(cat ?? "Tất cả");
  }, [searchParams]);

  const toggleDrinkType = (v: string) =>
    setSelectedDrinkTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const toggleCollection = (v: string) =>
    setSelectedCollections((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const toggleTag = (v: string) =>
    setSelectedTags((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const resetAllFilters = () => {
    setActiveCategory("Tất cả");
    setSelectedDrinkTypes([]);
    setSelectedPriceRange(null);
    setSelectedCollections([]);
    setSelectedTags([]);
    setSelectedRating(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return products.filter((item) => {
      const catName = getCategoryName(item, categories);
      const tags = item.tags ?? [];

      const matchCategory = activeCategory === "Tất cả" || catName === activeCategory;
      const matchSearch =
        (item.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (catName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = priceInRange(item.price, selectedPriceRange);
      const matchDrinkType = selectedDrinkTypes.length === 0 || selectedDrinkTypes.some((dt) => tags.includes(dt));
      const matchCollection = selectedCollections.length === 0 || selectedCollections.some((col) => tags.includes(col));
      const matchTags = selectedTags.length === 0 || selectedTags.some((t) => tags.includes(t));
      // Rating filter: no rating field on Product, skip
      const matchRating = selectedRating === null;

      return matchCategory && matchSearch && matchPrice && matchDrinkType && matchCollection && matchTags && matchRating;
    });
  }, [products, categories, activeCategory, searchQuery, selectedPriceRange, selectedDrinkTypes, selectedCollections, selectedTags, selectedRating]);

  // Reset page when filters/search change
  useEffect(() => { setCurrentPage(1); }, [activeCategory, searchQuery, selectedPriceRange, selectedDrinkTypes, selectedCollections, selectedTags, selectedRating]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters =
    activeCategory !== "Tất cả" ||
    selectedDrinkTypes.length > 0 ||
    selectedPriceRange !== null ||
    selectedCollections.length > 0 ||
    selectedTags.length > 0 ||
    selectedRating !== null ||
    searchQuery !== "";

  const sidebarProps = {
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
    onReset: resetAllFilters,
  };

  return (
    <div className="min-h-screen bg-cafe-bg pt-20">
      {/* Breadcrumb + Title */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 pt-8 pb-4">
        <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.66)", letterSpacing: "1px" }}>
          <Link to="/" className="hover:text-cafe-primary transition-colors">Trang chủ</Link>
          <span className="text-cafe-primary"> / Thực đơn</span>
        </p>
        <h1
          className="font-heading mt-1.5 uppercase text-cafe-primary"
          style={{ fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", letterSpacing: "1px" }}
        >
          Thực đơn
        </h1>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-10 pb-16">
        <div className="flex gap-8">

          {/* LEFT SIDEBAR (Desktop) */}
          <div className="hidden lg:block shrink-0 w-[240px]">
            <FilterSidebar {...sidebarProps} />
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
                  placeholder="Tìm kiếm thức uống..."
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
                Bộ lọc
                <svg
                  width="10" height="7" viewBox="0 0 10 6" fill="none"
                  style={{ transform: mobileSidebarOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .2s" }}
                >
                  <path d="M9.5 5.5L5 0.5L0.500004 5.5" stroke="#30261c" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.6)" }}>
                {filtered.length} món
              </p>
            </div>

            {mobileSidebarOpen && (
              <div className="lg:hidden bg-white border border-cafe-accent rounded-2xl p-5 mb-4">
                <FilterSidebar {...sidebarProps} />
              </div>
            )}

            {/* Desktop result count */}
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="font-body" style={{ fontWeight: 400, fontSize: 12, color: "rgba(48,38,28,0.6)" }}>
                Hiển thị{" "}
                <span className="text-cafe-primary" style={{ fontWeight: 700 }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                / <span className="text-cafe-primary" style={{ fontWeight: 700 }}>{filtered.length}</span> món
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="font-body text-cafe-gold hover:underline transition-all"
                  style={{ fontWeight: 500, fontSize: 12 }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                  {paginated.map((item) => (
                    <MenuCard key={item._id} item={item} categories={categories} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-10">
                    {/* Prev */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-cafe-border bg-white hover:border-cafe-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="font-body w-9 h-9 flex items-center justify-center" style={{ fontSize: 13, color: "rgba(48,38,28,0.4)" }}>
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => goToPage(item as number)}
                            className="font-body w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
                            style={{
                              fontSize: 13,
                              fontWeight: currentPage === item ? 700 : 400,
                              borderColor: currentPage === item ? "var(--cafe-primary)" : "var(--cafe-border)",
                              backgroundColor: currentPage === item ? "var(--cafe-primary)" : "white",
                              color: currentPage === item ? "white" : "var(--cafe-primary)",
                            }}
                          >
                            {item}
                          </button>
                        )
                      )}

                    {/* Next */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-cafe-border bg-white hover:border-cafe-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9c9c9" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <p className="font-body" style={{ fontWeight: 400, fontSize: 14, color: "rgba(48,38,28,0.5)" }}>
                  {products.length === 0 ? "Chưa có sản phẩm nào" : "Không tìm thấy món phù hợp"}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="font-body px-5 py-2 bg-cafe-primary text-white rounded-full hover:bg-cafe-dark transition-colors"
                    style={{ fontWeight: 500, fontSize: 13 }}
                  >
                    Xem tất cả
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
