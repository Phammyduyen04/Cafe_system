import { useState, useEffect, useRef } from "react";
import { productService } from "../../../services/product.service";
import { StarRating } from "./ProductCard";

const PER_PAGE = 3; // số bình luận mỗi slide (desktop)

type ReviewItem = { avatar: string; name: string; rating: number; text: string };

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ avatar, name, rating, text }: ReviewItem) {
  const initials = name.charAt(0).toUpperCase();
  return (
    <div className="bg-[rgba(226,217,200,0.4)] border-2 border-[rgba(48,38,28,0.1)] rounded-[18px] p-7 flex flex-col gap-4 w-full h-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-cafe-primary flex items-center justify-center shrink-0">
              <span className="font-body text-white" style={{ fontWeight: 700, fontSize: 18 }}>{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-body text-cafe-primary truncate" style={{ fontWeight: 600, fontSize: 15 }}>{name}</p>
          </div>
        </div>
        <StarRating filled={rating} />
      </div>
      <p className="font-body text-cafe-primary" style={{ fontWeight: 400, fontSize: 13, lineHeight: 1.7 }}>{text}</p>
    </div>
  );
}

// ─── Testimonials Section ──────────────────────────────────────────────────────
export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0); // desktop: trang (nhóm 3)
  const [activeMobile, setActiveMobile] = useState(0); // mobile: từng bình luận
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    productService.getStoreReviews()
      .then((data) => {
        setReviews(data.map((r) => ({
          avatar: r.avatar ?? "",
          name: r.customerName,
          rating: r.rating,
          text: r.comment,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Chia reviews thành từng nhóm PER_PAGE
  const pages: ReviewItem[][] = [];
  for (let i = 0; i < reviews.length; i += PER_PAGE) {
    pages.push(reviews.slice(i, i + PER_PAGE));
  }
  const totalPages = pages.length;
  const totalMobile = reviews.length;

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (totalPages === 0) return;
    intervalRef.current = setInterval(() => {
      setActivePage((prev) => (prev + 1) % totalPages);
      setActiveMobile((prev) => (prev + 1) % (totalMobile || 1));
    }, 4000);
    return () => stopAutoPlay();
  }, [totalPages, totalMobile]);

  const goToPage = (i: number) => {
    setActivePage(i);
    setActiveMobile(i * PER_PAGE);
    stopAutoPlay();
  };

  const prevPage = () => goToPage((activePage - 1 + totalPages) % totalPages);
  const nextPage = () => goToPage((activePage + 1) % totalPages);

  const prevMobile = () => setActiveMobile((prev) => (prev - 1 + totalMobile) % totalMobile);
  const nextMobile = () => setActiveMobile((prev) => (prev + 1) % totalMobile);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="bg-cafe-bg py-20 px-6">
      <div className="text-center mb-12">
        <p className="font-body text-cafe-primary" style={{ fontWeight: 400, fontSize: "clamp(24px, 3vw, 32px)" }}>
          Hãy đến và cùng chúng tôi
        </p>
        <h2 className="font-heading uppercase tracking-widest text-cafe-primary" style={{ fontWeight: 600, fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "1.28px" }}>
          Khách hàng hài lòng
        </h2>
      </div>

      {/* ── Mobile: 1 bình luận mỗi lần ── */}
      <div className="md:hidden flex flex-col items-center gap-6 px-2">
        <div className="w-full max-w-[440px]">
          <TestimonialCard {...reviews[activeMobile]} />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={prevMobile} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent" aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex gap-2">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => setActiveMobile(i)} aria-label={`Slide ${i + 1}`} className="rounded-full transition-all duration-300"
                style={{ width: i === activeMobile ? 24 : 10, height: 10, background: i === activeMobile ? "#30261c" : "rgba(48,38,28,0.3)", border: "none", cursor: "pointer" }}
              />
            ))}
          </div>
          <button onClick={nextMobile} className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent" aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>

      {/* ── Desktop: 3 bình luận mỗi slide ── */}
      <div className="hidden md:block relative max-w-[1200px] mx-auto">
        <button onClick={prevPage} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent" aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        {/* Viewport */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activePage * 100}%)` }}
          >
            {pages.map((group, pageIdx) => (
              <div key={pageIdx} className="flex gap-6 w-full shrink-0 items-stretch">
                {group.map((r, i) => (
                  <div key={i} className="flex-1 flex flex-col min-w-0">
                    <TestimonialCard {...r} />
                  </div>
                ))}
                {/* Điền placeholder nếu nhóm cuối thiếu card */}
                {group.length < PER_PAGE && Array.from({ length: PER_PAGE - group.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 min-w-0" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <button onClick={nextPage} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent" aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Dots — desktop: theo số trang */}
      <div className="hidden md:flex justify-center gap-3 mt-10">
        {pages.map((_, i) => (
          <button key={i} onClick={() => goToPage(i)} aria-label={`Trang ${i + 1}`} className="rounded-full transition-all duration-300"
            style={{ width: i === activePage ? 28 : 12, height: 12, background: i === activePage ? "#30261c" : "rgba(48,38,28,0.3)", border: "none", cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
