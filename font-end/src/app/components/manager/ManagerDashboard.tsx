import { useEffect, useState } from "react";
import { Link } from "react-router";
import { customerService } from "../../../services/customer.service";
import { staffService } from "../../../services/staff.service";
import { promotionService } from "../../../services/promotion.service";

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  to: string;
  color: string;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [custRes, empRes, shiftRes, promoRes, discountRes] = await Promise.allSettled([
        customerService.getAll(1, 1),
        staffService.getEmployees({ page: 1, limit: 1, status: "ACTIVE" }),
        staffService.getShifts({ page: 1, limit: 1, date: new Date().toISOString().split("T")[0] }),
        promotionService.getPromotions({ page: 1, limit: 1, status: "ACTIVE" }),
        promotionService.getDiscounts({ page: 1, limit: 1, status: "ACTIVE" }),
      ]);

      const getTotal = (res: PromiseSettledResult<any>) =>
        res.status === "fulfilled" ? (res.value?.pagination?.total ?? 0) : 0;

      setStats([
        {
          label: "Khách hàng",
          value: getTotal(custRes),
          icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
          to: "/manager/customers",
          color: "#3b82f6",
        },
        {
          label: "Nhân viên hoạt động",
          value: getTotal(empRes),
          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
          to: "/manager/employees",
          color: "#16a34a",
        },
        {
          label: "Ca hôm nay",
          value: getTotal(shiftRes),
          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
          to: "/manager/shifts",
          color: "#c4a35a",
        },
        {
          label: "Khuyến mãi đang chạy",
          value: getTotal(promoRes),
          icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          to: "/manager/promotions",
          color: "#e74c3c",
        },
        {
          label: "Giảm giá đang chạy",
          value: getTotal(discountRes),
          icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
          to: "/manager/discounts",
          color: "#9333ea",
        },
      ]);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-[var(--cafe-primary)] mb-8" style={{ fontSize: 28, fontWeight: 700 }}>
        Tổng quan
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[var(--cafe-gold)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {stats.map((s) => (
            <Link
              key={s.label}
              to={s.to}
              className="bg-white rounded-2xl p-5 border border-[var(--cafe-border)] hover:border-[var(--cafe-gold)] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "18" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
              </div>
              <p className="font-heading text-[var(--cafe-primary)]" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
                {s.value}
              </p>
              <p className="font-body text-[var(--cafe-primary)]/60 mt-1" style={{ fontSize: 13 }}>
                {s.label}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
