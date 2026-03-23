import { useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

interface MenuItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

interface MenuGroup {
  label: string;
  icon: string;
  children: MenuItem[];
}

type MenuEntry = MenuItem | MenuGroup;

function isGroup(entry: MenuEntry): entry is MenuGroup {
  return "children" in entry;
}

const MENU: MenuEntry[] = [
  { to: "/manager", label: "Tổng quan", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", end: true },
  { to: "/manager/customers", label: "Khách hàng", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/manager/employees", label: "Nhân viên", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { to: "/manager/shifts", label: "Ca làm", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  {
    label: "Quản lý sản phẩm",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    children: [
      { to: "/manager/beverages", label: "Quản lý đồ uống", icon: "M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
      { to: "/manager/ingredients", label: "Nguyên vật liệu", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
      { to: "/manager/categories", label: "Danh mục sản phẩm", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    ],
  },
  { to: "/manager/promotions", label: "Khuyến mãi", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/manager/discounts", label: "Giảm giá", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
];

export default function ManagerLayout() {
  const { isLoggedIn, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const location = useLocation();

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const hasAccess = user?.roles?.includes("MANAGER") || user?.userType === "MANAGER";
  if (!hasAccess) return <Navigate to="/" replace />;

  const isChildActive = (group: MenuGroup) =>
    group.children.some((c) => location.pathname === c.to || location.pathname.startsWith(c.to + "/"));

  return (
    <div className="min-h-screen flex bg-[var(--cafe-bg)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "var(--cafe-primary)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <span className="font-heading text-white" style={{ fontSize: 22, fontWeight: 700 }}>Coffea</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU.map((entry) => {
            if (isGroup(entry)) {
              const open = expandedGroup === entry.label || isChildActive(entry);
              return (
                <div key={entry.label}>
                  <button
                    onClick={() => setExpandedGroup(open && expandedGroup === entry.label ? null : entry.label)}
                    className={`w-full flex items-center gap-3 px-5 py-3 mx-2 rounded-lg font-body transition-colors ${
                      isChildActive(entry)
                        ? "text-white bg-white/10"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    style={{ fontSize: 13, fontWeight: 500, width: "calc(100% - 16px)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={entry.icon} />
                    </svg>
                    <span className="flex-1 text-left">{entry.label}</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {open && (
                    <div className="ml-4 mt-1 mb-1">
                      {entry.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg font-body transition-colors ${
                              isActive
                                ? "bg-[var(--cafe-gold)] text-white"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }`
                          }
                          style={{ fontSize: 12, fontWeight: 500 }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={child.icon} />
                          </svg>
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end={entry.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 mx-2 rounded-lg font-body transition-colors ${
                    isActive
                      ? "bg-[var(--cafe-gold)] text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={entry.icon} />
                </svg>
                {entry.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="font-body text-white/80 truncate" style={{ fontSize: 13, fontWeight: 500 }}>
            {user?.username}
          </p>
          <button
            onClick={logout}
            className="font-body text-white/40 hover:text-white/80 mt-1 transition-colors"
            style={{ fontSize: 12 }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[var(--cafe-border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--cafe-primary)" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 700 }}>Coffea</span>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
