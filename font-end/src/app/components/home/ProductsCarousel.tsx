import { useState } from "react";
import svgPaths from "../../../constants/svg-paths";
import ProductCard from "./ProductCard";

// ─── Products Carousel ─────────────────────────────────────────────────────────
export default function ProductsCarousel({ title, products }: { title: string; products: { img: string; name: string; desc: string; price: string; slug?: string }[] }) {
  const [idx, setIdx] = useState(0);
  const cardW = 300;
  const gap = 20;
  const max = Math.max(0, products.length - 1);

  return (
    <section className="py-16 bg-cafe-bg">
      <h2
        className="font-heading text-center mb-10 tracking-widest uppercase px-4 text-cafe-primary"
        style={{ fontWeight: 600, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "1.28px" }}
      >
        {title}
      </h2>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto flex gap-4 px-5 pb-4 snap-x snap-mandatory">
        {products.map((p, i) => (
          <div key={i} className="snap-start shrink-0">
            <ProductCard {...p} />
          </div>
        ))}
      </div>

      {/* Desktop: controlled carousel */}
      <div className="hidden md:flex relative items-center justify-center px-6 max-w-[1440px] mx-auto">
        {/* Prev */}
        <button
          onClick={() => setIdx((prev) => Math.max(0, prev - 1))}
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
            {products.map((p, i) => (
              <div key={i} className="shrink-0" style={{ width: cardW }}>
                <ProductCard {...p} />
              </div>
            ))}
          </div>
        </div>

        {/* Next */}
        <button
          onClick={() => setIdx((prev) => Math.min(max, prev + 1))}
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
