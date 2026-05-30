import { useState, useEffect, useRef } from "react";
import svgPaths from "../../../constants/svg-paths";
import ProductCard from "./ProductCard";
import type { Product, Category } from "../../../services/product.service";

export default function ProductsCarousel({ title, products, categories }: { title: string; products: Product[]; categories?: Category[] }) {
  const [idx, setIdx] = useState(0);
  const cardW = 300;
  const gap = 20;
  const max = Math.max(0, products.length - 1);
  const paused = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Auto-play: advance one card every 3.5s, reset to 0 at end
  useEffect(() => {
    if (products.length <= 1) return;
    const timer = setInterval(() => {
      if (!paused.current) {
        setIdx((prev) => (prev >= max ? 0 : prev + 1));
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [max, products.length]);

  // Scroll-reveal on enter viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 bg-cafe-bg"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      <h2
        className="font-heading text-center mb-10 tracking-widest uppercase px-4 text-cafe-primary"
        style={{ fontWeight: 600, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "1.28px" }}
      >
        {title}
      </h2>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto flex gap-4 px-5 pb-4 snap-x snap-mandatory">
        {products.map((p) => (
          <div key={p._id} className="snap-start shrink-0">
            <ProductCard product={p} categories={categories} />
          </div>
        ))}
      </div>

      {/* Desktop: controlled carousel */}
      <div
        className="hidden md:flex relative items-center justify-center px-6 max-w-[1440px] mx-auto"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        {/* Prev */}
        <button
          onClick={() => { paused.current = true; setIdx((prev) => Math.max(0, prev - 1)); setTimeout(() => { paused.current = false; }, 5000); }}
          disabled={idx === 0}
          className="shrink-0 w-[56px] h-[56px] rounded-full flex items-center justify-center mr-4 transition-opacity hover:opacity-70 disabled:opacity-30 bg-cafe-accent"
          aria-label="Previous"
        >
          <svg width="24" height="24" viewBox="0 0 71 71" fill="none">
            <path d="M45.9167 36H26.0833" stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d={svgPaths.arrowLeft} stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>

        {/* Cards wrapper */}
        <div className="overflow-hidden flex-1">
          <div
            className="flex gap-5 transition-transform duration-300"
            style={{ transform: `translateX(calc(-${idx} * ${cardW + gap}px))` }}
          >
            {products.map((p) => (
              <div key={p._id} className="shrink-0" style={{ width: cardW }}>
                <ProductCard product={p} categories={categories} />
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={() => { paused.current = true; setIdx((prev) => Math.min(max, prev + 1)); setTimeout(() => { paused.current = false; }, 5000); }}
          disabled={idx === max}
          className="shrink-0 w-[56px] h-[56px] rounded-full flex items-center justify-center ml-4 transition-opacity hover:opacity-70 disabled:opacity-30 bg-cafe-accent"
          aria-label="Next"
        >
          <svg width="24" height="24" viewBox="0 0 71 71" fill="none">
            <path d="M26.0833 36H45.9167" stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d={svgPaths.arrowRight} stroke="#30261C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </section>
  );
}
