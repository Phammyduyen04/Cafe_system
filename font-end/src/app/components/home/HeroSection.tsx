import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import banner1 from "../../../assets/banner1.jpg";
import banner2 from "../../../assets/banner2.jpg";
import banner3 from "../../../assets/banner3.jpg";

// ─── Hero Carousel ──────────────────────────────────────────────────────────────
const heroSlides = [
  {
    tag: "Chào mừng",
    title: <>Chúng tôi phục vụ<br />cà phê ngon nhất<br />thành phố!</>,
    desc: "Thưởng thức hương vị cà phê đặc sắc, được chắt lọc từ những hạt cà phê thượng hạng, mang đến trải nghiệm khó quên.",
    cta: "Xem thực đơn",
    ctaHref: "/menu",
    bg: banner1,
  },
  {
    tag: "Ưu đãi đặc biệt",
    title: <>Hạt cà phê<br />thượng hạng<br />từ Đà Lạt!</>,
    desc: "Chọn lọc kỹ càng từ những vườn cà phê xanh mướt trên cao nguyên Lâm Đồng — hương thơm thuần khiết, vị đậm đà khó cưỡng.",
    cta: "Khám phá nguồn gốc",
    ctaHref: "/menu?category=Cà phê",
    bg: banner2,
  },
  {
    tag: "Món mới",
    title: <>Trà & Đá xay<br />mát lạnh cho<br />ngày hè!</>,
    desc: "Giải nhiệt với loạt thức uống mới: trà matcha Nhật Bản, đá xay trái cây và nhiều hương vị tươi mát đang chờ bạn khám phá.",
    cta: "Xem thực đơn",
    ctaHref: "/menu?category=Trà",
    bg: banner3,
  },
];

// ─── Hero Section ────────────────────────────────────────────────────────────
export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  // Auto-play every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative min-h-[600px] md:min-h-[750px] overflow-hidden flex items-center">
      {/* Background images */}
      {heroSlides.map((s, i) => (
        <img
          key={i}
          src={s.bg}
          alt="Coffee background"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Wave shape at bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: 70 }}>
        <svg
          viewBox="0 0 2265 524"
          preserveAspectRatio="none"
          className="w-full h-full fill-cafe-bg"
        >
          <path d="M0,122.764 C525,-194.299 1206,213.701 2265,122.764 L2265,524 L0,524 Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-[1400px] mx-auto px-6 sm:px-10 md:px-16 pt-24 pb-28 md:pb-32">
        {/* Left text */}
        <div className="flex flex-col gap-6 md:gap-8 text-white max-w-[520px] w-full text-center md:text-left items-center md:items-start">
          <div className="flex flex-col gap-4 md:gap-6">
            <p
              className="font-alt uppercase tracking-[4px]"
              style={{ fontWeight: 500, fontSize: "clamp(13px, 1.5vw, 16px)" }}
            >
              {slide.tag}
            </p>
            <h1
              className="font-heading text-white"
              style={{ fontWeight: 700, fontSize: "clamp(26px, 3.8vw, 54px)", lineHeight: 1.15 }}
            >
              {slide.title}
            </h1>
          </div>
          <p className="font-alt" style={{ fontWeight: 400, fontSize: "clamp(14px, 1.5vw, 17px)", lineHeight: 1.6, maxWidth: 400, color: "rgba(255,255,255,0.9)" }}>
            {slide.desc}
          </p>
          <Link
            to={slide.ctaHref}
            className="font-body bg-white text-cafe-primary rounded-full px-8 sm:px-10 py-3 sm:py-4 hover:bg-cafe-bg transition-colors w-full sm:w-auto max-w-[260px] text-center"
            style={{ fontWeight: 500, fontSize: "clamp(14px, 1.5vw, 17px)" }}
          >
            Đặt ngay!
          </Link>

          {/* Dots */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className="transition-all duration-300"
                  style={{
                    width: i === current ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === current ? "white" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
