import { useRef, useEffect, useState } from "react";
import { Link } from "react-router";
import beansExplosion from "../../../assets/beans-explosion.png";
import coffeeCupSplash from "../../../assets/coffee-cup-splash.png";

// ─── Coffee Beans Banner ───────────────────────────────────────────────────────
export default function CoffeeBeansBanner() {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setOffset((rect.top + rect.height / 2 - window.innerHeight / 2) * 0.12);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-cafe-accent overflow-hidden" style={{ minHeight: 280 }}>
      <img
        src={beansExplosion}
        alt=""
        className="absolute left-0 bottom-0 pointer-events-none hidden sm:block"
        style={{
          width: "28%",
          maxWidth: 320,
          transform: `scaleX(-1) translateY(${offset}px)`,
          willChange: "transform",
        }}
      />
      <img
        src={coffeeCupSplash}
        alt=""
        className="absolute right-0 bottom-0 pointer-events-none hidden sm:block"
        style={{
          width: "26%",
          maxWidth: 300,
          transform: `translateY(${-offset}px)`,
          willChange: "transform",
        }}
      />
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
