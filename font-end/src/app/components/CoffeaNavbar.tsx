import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import svgPaths from "../../constants/svg-paths";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { authService } from "../../services/auth.service";
import { productService } from "../../services/product.service";
import type { Category } from "../../services/product.service";

export default function CoffeaNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isLoggedIn, user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const isMenuPage = location.pathname === "/menu";

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
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
      navigate("/checkout");
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
      href: "#",
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
          <div className="flex items-center gap-2">
            {searchOpen && (
              <div className="flex items-center bg-white/90 rounded-full px-4 py-2 gap-2 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 26.5 26.5" fill="none">
                  <path d={svgPaths.searchCircle} stroke="var(--cafe-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  <path d="M25.25 25.25L19.45 19.45" stroke="var(--cafe-primary)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm tên đồ uống..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-body bg-transparent outline-none text-cafe-primary placeholder-cafe-primary/50 w-44"
                  style={{ fontSize: 13 }}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                    if (e.key === "Enter" && searchQuery) {
                      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-cafe-primary/50 hover:text-cafe-primary transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
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
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="font-body flex-1 py-2.5 border border-white/40 text-white rounded-full hover:bg-white/10 transition-colors"
                style={{ fontWeight: 500, fontSize: 14 }}
              >
                Đăng xuất
              </button>
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
