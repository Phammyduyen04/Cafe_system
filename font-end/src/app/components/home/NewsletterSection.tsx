import { useState, useRef, useEffect } from "react";
import newsletterCoffeeBeans from "../../../assets/newsletter-coffee-beans.png";
import svgPaths from "../../../constants/svg-paths";

// ─── Newsletter Section ────────────────────────────────────────────────────────
export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      setOffset((rect.top + rect.height / 2 - window.innerHeight / 2) * 0.1);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-cafe-accent overflow-hidden py-16 px-6">
      <img
        src={newsletterCoffeeBeans}
        alt=""
        className="absolute left-0 top-0 h-full object-cover pointer-events-none opacity-80 hidden sm:block"
        style={{
          width: "22%",
          transform: `scaleY(-1) translateY(${offset}px)`,
          willChange: "transform",
        }}
      />
      <img
        src={newsletterCoffeeBeans}
        alt=""
        className="absolute right-0 top-0 h-full object-cover pointer-events-none opacity-80 hidden sm:block"
        style={{
          width: "22%",
          transform: `scaleX(-1) translateY(${-offset}px)`,
          willChange: "transform",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center gap-4">
        <h2
          className="font-body text-cafe-primary"
          style={{ fontWeight: 600, fontSize: "clamp(22px, 3.5vw, 32px)" }}
        >
          Đăng ký ngay — Nhận ưu đãi 15%!
        </h2>
        <p className="font-body text-cafe-primary" style={{ fontWeight: 500, fontSize: 15 }}>
          Đăng ký nhận bản tin của chúng tôi và nhận ngay mã giảm giá 15%.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-[520px]">
          <div className="flex items-center gap-2 bg-cafe-bg rounded-full px-5 py-3 flex-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d={svgPaths.mail} stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              <path d="M22 6L12 13L2 6" stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              type="email"
              placeholder="Địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-body bg-transparent outline-none flex-1 text-cafe-primary placeholder-[#30261c]"
              style={{ fontWeight: 600, fontSize: 15 }}
            />
          </div>
          <button
            className="font-body bg-cafe-primary text-cafe-bg rounded-full px-8 py-3 hover:bg-cafe-dark transition-colors whitespace-nowrap"
            style={{ fontWeight: 600, fontSize: 15 }}
          >
            Đăng ký
          </button>
        </div>
      </div>
    </section>
  );
}
