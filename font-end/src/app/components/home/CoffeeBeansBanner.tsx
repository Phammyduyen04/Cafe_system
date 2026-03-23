import { Link } from "react-router";

// ─── Coffee Beans Banner ───────────────────────────────────────────────────────
export default function CoffeeBeansBanner() {
  return (
    <section className="relative bg-cafe-accent overflow-hidden" style={{ minHeight: 280 }}>
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center py-12 sm:py-16 px-8 sm:px-16 text-center gap-5 sm:gap-6">
        <h2
          className="font-heading text-cafe-primary"
          style={{ fontWeight: 600, fontSize: "clamp(22px, 4vw, 40px)", lineHeight: 1.3, maxWidth: 360 }}
        >
          Khám phá hạt cà phê thượng hạng của chúng tôi
        </h2>
        <Link
          to="/menu"
          className="font-alt flex items-center gap-2 bg-cafe-primary text-cafe-bg rounded-full px-7 sm:px-9 py-3 hover:bg-cafe-dark transition-colors"
          style={{ fontWeight: 500, fontSize: "clamp(13px, 1.5vw, 15px)" }}
        >
          Xem sản phẩm
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="#F1F0EE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="#F1F0EE" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
