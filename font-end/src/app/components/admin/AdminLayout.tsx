import { useState } from "react";
import { NavLink, Outlet, Navigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

const MENU = [
  {
    to: "/admin/accounts",
    label: "Quản lý tài khoản",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    to: "/admin/roles",
    label: "Phân quyền",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
];

export default function AdminLayout() {
  const { isLoggedIn, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const hasAccess =
    user?.roles?.includes("ADMIN") || user?.userType === "ADMIN";
  if (!hasAccess) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex bg-[var(--cafe-bg)]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
          <span
            className="font-heading text-white"
            style={{ fontSize: 22, fontWeight: 700 }}
          >
            Coffea
          </span>
          <span
            className="font-body px-2 py-0.5 rounded-full bg-red-500/80 text-white"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}
          >
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {MENU.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={entry.icon} />
              </svg>
              {entry.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-5 py-4 border-t border-white/10">
          <p
            className="font-body text-white/80 truncate"
            style={{ fontSize: 13, fontWeight: 500 }}
          >
            {user?.fullName || user?.username}
          </p>
          <p
            className="font-body text-white/40 truncate mb-1"
            style={{ fontSize: 11 }}
          >
            {user?.username}
          </p>
          <button
            onClick={logout}
            className="font-body text-white/40 hover:text-white/80 transition-colors"
            style={{ fontSize: 12 }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[var(--cafe-border)]">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--cafe-primary)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span
            className="font-heading text-[var(--cafe-primary)]"
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            Coffea Admin
          </span>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
