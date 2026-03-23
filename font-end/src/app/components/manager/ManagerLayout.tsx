import { useState } from "react";
import { NavLink, Outlet, Navigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

const MENU = [
  { to: "/manager", label: "Tổng quan", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", end: true },
  { to: "/manager/customers", label: "Khách hàng", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/manager/employees", label: "Nhân viên", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { to: "/manager/shifts", label: "Ca làm", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/manager/promotions", label: "Khuyến mãi", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { to: "/manager/discounts", label: "Giảm giá", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
];

export default function ManagerLayout() {
  const { isLoggedIn, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const hasAccess = user?.roles?.includes("MANAGER") || user?.userType === "MANAGER";
  if (!hasAccess) return <Navigate to="/" replace />;

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
          <span className="font-body text-white/50" style={{ fontSize: 11 }}>Manager</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
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
          <span className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 18, fontWeight: 700 }}>Coffea Manager</span>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
