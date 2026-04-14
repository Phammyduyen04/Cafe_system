import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import svgPaths from "../../constants/svg-paths";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { authService } from "../../services/auth.service";
import { productService, getProductImage } from "../../services/product.service";
import type { Category, Product } from "../../services/product.service";

const MAX_SUGGESTIONS = 6;

export default function CoffeaNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  const { isLoggedIn, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isMenuPage = location.pathname === "/menu";

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Lazy-load products khi user mở search
  const loadProductsIfNeeded = () => {
    if (!productsLoaded) {
      productService.getProducts().then(p => {
        setAllProducts(p);
        setProductsLoaded(true);
      }).catch(() => {});
    }
  };

  // Kết quả gợi ý
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !productsLoaded) return [];
    return allProducts
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [allProducts, searchQuery, productsLoaded]);

  const showSuggestions = searchOpen && searchQuery.trim().length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setHighlightedIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const submitSearch = (q: string) => {
    if (!q.trim()) return;
    navigate(`/menu?search=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
    setHighlightedIdx(-1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchQuery("");
      setHighlightedIdx(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, suggestions.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, -1));
      return;
    }
    if (e.key === "Enter") {
      if (highlightedIdx >= 0 && highlightedIdx < suggestions.length) {
        const product = suggestions[highlightedIdx];
        navigate(`/product/${product.slug ?? product._id}`);
        setSearchOpen(false);
        setSearchQuery("");
        setHighlightedIdx(-1);
      } else {
        submitSearch(searchQuery);
      }
    }
  };

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    logout();
    setAccountOpen(false);
    navigate("/");
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/cart");
    }
  };

  const menuItems = [
    { label: "Trang chủ", href: "/", children: [] as { label: string; href: string }[] },
    {
      label: "Menu",
      href: "/menu",
      children: categories.map((cat) => ({
        label: cat.name,
        href: `/menu?category=${encodeURIComponent(cat.name)}`,
      })),
    },
    {
      label: "Khuyến mãi",
      href: "/promotions",
      children: [] as { label: string; href: string }[],
    },
    { label: "Giới thiệu", href: "/about", children: [] as { label: string; href: string }[] },
    { label: "Liên hệ", href: "/contact", children: [] as { label: string; href: string }[] },
  ];

  const ChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" ref={dropdownRef}>
      <div className={`flex items-center justify-between px-8 md:px-12 py-4 backdrop-blur-sm transition-all duration-300 ${
        isMenuPage
          ? scrolled ? "bg-cafe-primary/98 shadow-lg py-3" : "bg-cafe-primary/95"
          : scrolled ? "bg-cafe-primary/95 shadow-lg py-3" : "bg-cafe-primary"
      }`}>

        {/* ── LEFT: Logo ── */}
        <Link
          to="/"
          className="font-heading lowercase text-white shrink-0"
          style={{ fontWeight: 700, fontSize: 28, letterSpacing: 1 }}
        >
          Coffea
        </Link>

        {/* ── CENTER: Desktop Menu ── */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              {item.children.length === 0 ? (
                <Link
                  to={item.href}
                  className="font-body flex items-center gap-1 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                  style={{ fontWeight: 500, fontSize: 14 }}
                  onClick={() => setOpenDropdown(null)}
                >
                  {item.label}
                </Link>
              ) : item.href !== "#" ? (
                <div className="flex items-center rounded-lg overflow-hidden hover:bg-white/10 transition-colors">
                  <Link
                    to={item.href}
                    className="font-body pl-4 pr-2 py-2 text-white"
                    style={{ fontWeight: 500, fontSize: 14 }}
                    onClick={() => setOpenDropdown(null)}
                  >
                    {item.label}
                  </Link>
                  <button
                    className="pr-3 py-2 text-white"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    aria-label={`Mở danh mục ${item.label}`}
                  >
                    <span className="flex transition-transform duration-200" style={{ transform: openDropdown === item.label ? "rotate(180deg)" : "rotate(0deg)" }}>
                      <ChevronDown />
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  className="font-body flex items-center gap-1 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                  style={{ fontWeight: 500, fontSize: 14 }}
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                >
                  {item.label}
                  <span className="transition-transform duration-200" style={{ transform: openDropdown === item.label ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <ChevronDown />
                  </span>
                </button>
              )}

              {/* Dropdown */}
              {item.children.length > 0 && openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-cafe-accent">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.href}
                      className="font-body flex items-center gap-2 px-5 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors"
                      style={{ fontWeight: 400, fontSize: 14 }}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── RIGHT: Actions ── */}
        <div className="hidden lg:flex items-center gap-2">

          {/* Search */}
          <div className="flex items-center gap-2" ref={searchRef}>
            {searchOpen && (
              <div className="relative">
                <div className="flex items-center bg-white/90 rounded-full px-4 py-2 gap-2 shadow-sm" style={{ minWidth: 220 }}>
                  <svg width="16" height="16" viewBox="0 0 26.5 26.5" fill="none">
                    <path d={svgPaths.searchCircle} stroke="var(--cafe-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    <path d="M25.25 25.25L19.45 19.45" stroke="var(--cafe-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    autoFocus
                    type="text"
                    placeholder="Tìm tên đồ uống..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setHighlightedIdx(-1); loadProductsIfNeeded(); }}
                    className="font-body bg-transparent outline-none text-cafe-primary placeholder-cafe-primary/50 w-40"
                    style={{ fontSize: 13 }}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); setHighlightedIdx(-1); searchInputRef.current?.focus(); }} className="text-cafe-primary/50 hover:text-cafe-primary transition-colors shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {showSuggestions && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-cafe-accent">
                    {suggestions.length > 0 ? (
                      <>
                        <div className="py-1">
                          {suggestions.map((product, idx) => (
                            <button
                              key={product._id}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cafe-bg transition-colors text-left"
                              style={{ background: idx === highlightedIdx ? "var(--cafe-bg)" : undefined }}
                              onMouseEnter={() => setHighlightedIdx(idx)}
                              onClick={() => {
                                navigate(`/product/${product.slug ?? product._id}`);
                                setSearchOpen(false);
                                setSearchQuery("");
                                setHighlightedIdx(-1);
                              }}
                            >
                              <img
                                src={getProductImage(product)}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg shrink-0 border border-cafe-accent"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-cafe-primary truncate" style={{ fontSize: 13, fontWeight: 600 }}>
                                  {product.name}
                                </p>
                                <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)" }}>
                                  {product.price.toLocaleString("vi-VN")}đ
                                </p>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(48,38,28,0.3)", shrink: 0 }}>
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 border-t border-cafe-accent hover:bg-cafe-bg transition-colors"
                          style={{ background: highlightedIdx === suggestions.length ? "var(--cafe-bg)" : undefined }}
                          onMouseEnter={() => setHighlightedIdx(suggestions.length)}
                          onClick={() => submitSearch(searchQuery)}
                        >
                          <span className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>
                            Xem tất cả kết quả cho "{searchQuery}"
                          </span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--cafe-primary)" }}>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-4 flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "rgba(48,38,28,0.3)" }}>
                          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                        </svg>
                        <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.45)" }}>
                          Không tìm thấy kết quả cho "{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => { setSearchOpen(s => { if (!s) loadProductsIfNeeded(); return !s; }); setSearchQuery(""); setHighlightedIdx(-1); }}
              className="w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
              aria-label="Tìm kiếm"
            >
              <svg width="18" height="18" viewBox="0 0 26.5 26.5" fill="none">
                <path d={svgPaths.searchCircle} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                <path d="M25.25 25.25L19.45 19.45" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
              </svg>
            </button>
          </div>

          {/* Cart */}
          <button
            onClick={handleCartClick}
            className="relative w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
            aria-label="Giỏ hàng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span
                className="font-body absolute -top-1 -right-1 w-4 h-4 bg-cafe-red rounded-full text-white flex items-center justify-center"
                style={{ fontSize: 10, fontWeight: 700 }}
              >
                {cartCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-white/30 mx-1" />

          {/* Account */}
          {isLoggedIn ? (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-white hover:bg-white/20 transition-colors"
                aria-label="Tài khoản"
              >
                <div className="w-8 h-8 rounded-full bg-cafe-accent flex items-center justify-center">
                  <span className="font-body text-cafe-primary" style={{ fontSize: 12, fontWeight: 700 }}>
                    {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl overflow-hidden z-50 border border-cafe-accent">
                  <div className="px-4 py-3 border-b border-cafe-accent">
                    <p className="font-body text-cafe-primary" style={{ fontWeight: 600, fontSize: 13 }}>
                      {user?.username}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors"
                    style={{ fontWeight: 500, fontSize: 14 }}
                    onClick={() => setAccountOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Hồ sơ tài khoản
                  </Link>
                  <Link
                    to="/my-orders"
                    className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors"
                    style={{ fontWeight: 500, fontSize: 14 }}
                    onClick={() => setAccountOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" />
                      <path d="M9 12h6M9 16h4" />
                    </svg>
                    Đơn hàng của tôi
                  </Link>
                  {(user?.userType === "ADMIN" || user?.roles?.includes("ADMIN")) && (
                    <Link
                      to="/admin"
                      className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors border-t border-cafe-accent"
                      style={{ fontWeight: 500, fontSize: 14 }}
                      onClick={() => setAccountOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Trang Admin
                    </Link>
                  )}
                  {(user?.userType === "MANAGER" || user?.roles?.includes("MANAGER")) && (
                    <Link
                      to="/manager"
                      className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors border-t border-cafe-accent"
                      style={{ fontWeight: 500, fontSize: 14 }}
                      onClick={() => setAccountOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                      </svg>
                      Trang Quản lý
                    </Link>
                  )}
                  {(user?.userType === "STAFF" || user?.roles?.includes("STAFF")) && (
                    <Link
                      to="/staff"
                      className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-primary hover:bg-cafe-bg transition-colors border-t border-cafe-accent"
                      style={{ fontWeight: 500, fontSize: 14 }}
                      onClick={() => setAccountOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Trang Nhân viên
                    </Link>
                  )}
                  <button
                    className="font-body flex items-center gap-3 w-full px-4 py-3 text-cafe-red hover:bg-red-50 transition-colors"
                    style={{ fontWeight: 500, fontSize: 14 }}
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="font-body px-4 py-2 text-white border border-white/60 rounded-full hover:bg-white/10 transition-colors"
                style={{ fontWeight: 500, fontSize: 13 }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="font-body px-4 py-2 bg-white text-cafe-primary rounded-full hover:bg-cafe-bg transition-colors"
                style={{ fontWeight: 600, fontSize: 13 }}
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-cafe-primary/95 backdrop-blur-sm px-6 py-4 flex flex-col gap-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.children.length === 0 ? (
                <Link
                  to={item.href}
                  className="font-body flex items-center w-full px-3 py-3 text-white rounded-lg hover:bg-white/10 transition-colors"
                  style={{ fontWeight: 500, fontSize: 15 }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ) : item.href !== "#" ? (
                <>
                  <div className="flex items-center rounded-lg hover:bg-white/10 transition-colors">
                    <Link
                      to={item.href}
                      className="font-body flex-1 px-3 py-3 text-white"
                      style={{ fontWeight: 500, fontSize: 15 }}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                    <button
                      className="px-3 py-3 text-white"
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      aria-label={`Mở danh mục ${item.label}`}
                    >
                      <span className="flex transition-transform duration-200" style={{ transform: openDropdown === item.label ? "rotate(180deg)" : "rotate(0)" }}>
                        <ChevronDown />
                      </span>
                    </button>
                  </div>
                  {openDropdown === item.label && (
                    <div className="ml-4 mb-2 flex flex-col gap-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="font-body flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          style={{ fontWeight: 400, fontSize: 14 }}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="font-body flex items-center justify-between w-full px-3 py-3 text-white rounded-lg hover:bg-white/10 transition-colors"
                    style={{ fontWeight: 500, fontSize: 15 }}
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    <span className="transition-transform duration-200" style={{ transform: openDropdown === item.label ? "rotate(180deg)" : "rotate(0)" }}>
                      <ChevronDown />
                    </span>
                  </button>
                  {openDropdown === item.label && (
                    <div className="ml-4 mb-2 flex flex-col gap-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          to={child.href}
                          className="font-body flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          style={{ fontWeight: 400, fontSize: 14 }}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Mobile Cart + Auth */}
          <div className="flex gap-3 pt-3 border-t border-white/20 mt-2">
            {/* Cart button */}
            <button
              onClick={() => { setMobileOpen(false); handleCartClick(); }}
              className="font-body relative px-4 py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors flex items-center gap-2"
              style={{ fontWeight: 500, fontSize: 14 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && (
                <span className="bg-cafe-red text-white rounded-full px-1.5 text-xs font-bold">{cartCount}</span>
              )}
            </button>

            {isLoggedIn ? (
              <div className="flex flex-col gap-2 flex-1">
                {(user?.roles?.includes("CUSTOMER") || user?.userType === "CUSTOMER") && (
                  <Link to="/profile" className="font-body py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-center" style={{ fontWeight: 500, fontSize: 14 }} onClick={() => setMobileOpen(false)}>Tài khoản</Link>
                )}
                {(user?.roles?.includes("STAFF") || user?.userType === "EMPLOYEE") && (
                  <Link to="/staff/schedule" className="font-body py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-center" style={{ fontWeight: 500, fontSize: 14 }} onClick={() => setMobileOpen(false)}>Lịch làm</Link>
                )}
                {(user?.roles?.includes("MANAGER") || user?.userType === "MANAGER") && (
                  <Link to="/manager" className="font-body py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-center" style={{ fontWeight: 500, fontSize: 14 }} onClick={() => setMobileOpen(false)}>Quản lý</Link>
                )}
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="font-body py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors"
                  style={{ fontWeight: 500, fontSize: 14 }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-body flex-1 py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors text-center"
                  style={{ fontWeight: 500, fontSize: 14 }}
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="font-body flex-1 py-2.5 bg-white text-cafe-primary rounded-full hover:bg-cafe-bg transition-colors text-center"
                  style={{ fontWeight: 600, fontSize: 14 }}
                  onClick={() => setMobileOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
