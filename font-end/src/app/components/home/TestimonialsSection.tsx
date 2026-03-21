import { useState, useEffect, useRef } from "react";
import { TESTIMONIAL_AVATAR } from "../../../constants/images";
import { StarRating } from "./ProductCard";

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ avatar, name, role, rating, text }: { avatar: string; name: string; role: string; rating: number; text: string }) {
  return (
    <div className="bg-[rgba(226,217,200,0.4)] border-2 border-[rgba(48,38,28,0.1)] rounded-[18px] p-7 flex flex-col gap-4 w-full max-w-[380px] h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-body text-cafe-primary" style={{ fontWeight: 600, fontSize: 16 }}>{name}</p>
            <p className="font-body" style={{ fontWeight: 400, fontSize: 13, color: "rgba(48,38,28,0.7)" }}>{role}</p>
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
  const [activeSlide, setActiveSlide] = useState(0);
  const total = 3;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const testimonials = [
    {
      avatar: TESTIMONIAL_AVATAR,
      name: "Nguyễn Minh Anh",
      role: "Doanh nhân",
      rating: 5,
      text: "Coffea thực sự là nơi tôi yêu thích mỗi buổi sáng. Cà phê đậm đà, không gian ấm cúng và nhân viên phục vụ rất nhiệt tình. Tôi luôn giới thiệu cho bạn bè và đồng nghiệp.",
    },
    {
      avatar: TESTIMONIAL_AVATAR,
      name: "Trần Thanh Huy",
      role: "Kỹ sư phần mềm",
      rating: 4,
      text: "Hương vị cà phê ở đây rất khác biệt so với các quán khác. Tôi đặc biệt thích món Lungo — đậm vị nhưng không gắt. Chắc chắn sẽ quay lại thường xuyên hơn!",
    },
    {
      avatar: TESTIMONIAL_AVATAR,
      name: "Lê Bảo Châu",
      role: "Giáo viên",
      rating: 5,
      text: "Không gian yên tĩnh, thức uống tuyệt vời và giá cả hợp lý. Coffea đã trở thành điểm đến lý tưởng của tôi mỗi cuối tuần để thư giãn và đọc sách.",
    },
  ];

  const startAutoPlay = () => {
    intervalRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % total);
    }, 4000);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const goTo = (i: number) => {
    setActiveSlide(i);
    stopAutoPlay();
    startAutoPlay();
  };

  const prev = () => goTo((activeSlide - 1 + total) % total);
  const next = () => goTo((activeSlide + 1) % total);

  return (
    <section className="bg-cafe-bg py-20 px-6">
      <div className="text-center mb-12">
        <p
          className="font-body text-cafe-primary"
          style={{ fontWeight: 400, fontSize: "clamp(24px, 3vw, 32px)" }}
        >
          Hãy đến và cùng chúng tôi
        </p>
        <h2
          className="font-heading uppercase tracking-widest text-cafe-primary"
          style={{ fontWeight: 600, fontSize: "clamp(18px, 2.5vw, 28px)", letterSpacing: "1.28px" }}
        >
          Khách hàng hài lòng
        </h2>
      </div>

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex flex-col items-center gap-6 px-2">
        <div className="w-full max-w-[440px]">
          <TestimonialCard {...testimonials[activeSlide]} />
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent"
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeSlide ? 24 : 10,
                  height: 10,
                  background: i === activeSlide ? "#30261c" : "rgba(48,38,28,0.3)",
                  border: "none",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent"
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:block relative max-w-[1200px] mx-auto">
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent"
          aria-label="Previous"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {Array.from({ length: total }).map((_, slideIdx) => (
              <div key={slideIdx} className="flex gap-6 w-full shrink-0 justify-center items-stretch">
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="flex-1 max-w-[380px] transition-all duration-500 flex flex-col"
                    style={{
                      opacity: slideIdx === activeSlide ? 1 : 0.4,
                      transform: slideIdx === activeSlide ? "scale(1)" : "scale(0.97)",
                    }}
                  >
                    <TestimonialCard {...t} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-md hover:opacity-80 transition-opacity bg-cafe-accent"
          aria-label="Next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30261c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Dots — desktop only */}
      <div className="hidden md:flex justify-center gap-3 mt-10">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeSlide ? 28 : 12,
              height: 12,
              background: i === activeSlide ? "#30261c" : "rgba(48,38,28,0.3)",
              border: "none",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </section>
  );
}
