import { useState } from "react";
import { NavLink, Outlet, Navigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

const MENU = [
  {
    to: "/staff/schedule",
    label: "Lịch làm việc",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    to: "/staff/availability",
    label: "Lịch rảnh",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    to: "/staff/orders",
    label: "Nhận đơn & Thu ngân",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
];

export default function StaffLayout() {
  const { isLoggedIn, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const hasAccess =
    user?.roles?.includes("STAFF") ||
    user?.userType === "STAFF" ||
    user?.userType === "EMPLOYEE";
  if (!hasAccess) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex bg-[var(--cafe-bg)]">
      {/* Mobile overlay */}
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
            className="font-body px-2 py-0.5 rounded-full bg-white/15 text-white/80"
            style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}
          >
            NHÂN VIÊN
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
        {/* Mobile header */}
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
            Coffea
          </span>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
