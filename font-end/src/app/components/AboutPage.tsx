import { Link } from "react-router";
import { useRef, useEffect, useState } from "react";
import { ABOUT_HERO, ABOUT_INTERIOR } from "../../constants/images";
import suMenh from "../../assets/su-menh.jpg";
import hatCaPhe from "../../assets/hat-ca-phe.jpg";
import khongGian from "../../assets/khong-gian.jpg";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const revealStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(36px)",
    transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
  };
  return { ref, revealStyle };
}

function useImgParallax(speed = 0.08) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      setOffset((r.top + r.height / 2 - window.innerHeight / 2) * speed);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [speed]);
  const imgStyle: React.CSSProperties = {
    transform: `translateY(${offset}px)`,
    willChange: "transform",
    height: "115%",
    width: "100%",
    objectFit: "cover",
    marginTop: "-7.5%",
  };
  return { wrapRef, imgStyle };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const scrollY = useScrollY();

  // scroll-reveal refs
  const r1 = useReveal();
  const r2 = useReveal();
  const r3 = useReveal();
  const r4 = useReveal();
  const r5 = useReveal();
  const r6 = useReveal();
  const r7 = useReveal();
  const r8 = useReveal();

  // image parallax refs
  const img1 = useImgParallax(0.07); // ABOUT_INTERIOR
  const img2 = useImgParallax(0.07); // su-menh
  const img3 = useImgParallax(0.07); // hat-ca-phe
  const img4 = useImgParallax(0.07); // khong-gian

  return (
    <div className="min-h-screen bg-cafe-bg">

      {/* ── 1. Hero ── */}
      <div className="relative h-[480px] md:h-[560px] overflow-hidden">
        <img
          src={ABOUT_HERO}
          alt="Coffea"
          className="absolute object-cover object-center"
          style={{
            top: "-120px",
            left: 0,
            right: 0,
            width: "100%",
            height: "calc(100% + 240px)",
            transform: `translateY(${scrollY * 0.3}px)`,
            willChange: "transform",
          }}
        />
        <div className="absolute inset-0 bg-cafe-primary/55" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body" style={{ fontSize: 12, letterSpacing: "4px", color: "rgba(241,240,238,0.7)", textTransform: "uppercase", marginBottom: 14 }}>
            Câu chuyện của chúng tôi
          </p>
          <h1 className="font-body" style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, color: "var(--cafe-bg)", letterSpacing: "2px", lineHeight: 1.15 }}>
            Về Coffea
          </h1>
          <div className="w-12 h-px bg-cafe-accent mt-5 mx-auto" />
        </div>
      </div>

      {/* ── 2. Khởi nguồn ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div ref={r1.ref} style={r1.revealStyle} className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Khởi nguồn
            </p>
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>
              Bắt đầu từ một tình yêu với cà phê
            </h2>
            <div className="flex flex-col gap-5">
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Coffea ra đời từ niềm đam mê dành cho cà phê specialty và mong muốn mang đến những ly cà phê chất lượng, chỉn chu và gần gũi hơn với cộng đồng.
              </p>
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Chúng tôi tin rằng một tách cà phê ngon không chỉ đến từ hạt cà phê tốt, mà còn đến từ sự tận tâm trong từng công đoạn: lựa chọn nguyên liệu, rang xay, pha chế và phục vụ.
              </p>
            </div>
          </div>
          <div ref={img1.wrapRef} className="overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <img src={ABOUT_INTERIOR} alt="Không gian Coffea" style={img1.imgStyle} />
          </div>
        </div>
      </div>

      {/* ── 3. Câu chuyện thương hiệu ── */}
      <div className="bg-cafe-accent py-20 px-6">
        <div ref={r2.ref} style={r2.revealStyle} className="max-w-[800px] mx-auto text-center">
          <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 700, marginBottom: 28 }}>
            Câu chuyện của Coffea
          </h2>
          <div className="flex flex-col gap-6">
            <p className="font-body" style={{ fontSize: 15, color: "rgba(48,38,28,0.8)", lineHeight: 2 }}>
              Coffea được xây dựng với mong muốn trở thành một điểm dừng chân quen thuộc cho những người yêu cà phê. Tại đây, mỗi ly cà phê đều được chuẩn bị cẩn thận, giữ trọn hương vị tự nhiên của hạt và mang đến trải nghiệm thưởng thức nhẹ nhàng, tinh tế.
            </p>
            <p className="font-body" style={{ fontSize: 15, color: "rgba(48,38,28,0.8)", lineHeight: 2 }}>
              Không chạy theo sự cầu kỳ, Coffea chọn cách tập trung vào những điều cốt lõi: nguyên liệu chất lượng, không gian thoải mái và dịch vụ chân thành. Chúng tôi mong rằng mỗi khách hàng khi ghé Coffea đều có thể tìm thấy một khoảng thời gian riêng để thư giãn, làm việc, trò chuyện hoặc đơn giản là tận hưởng một tách cà phê đúng gu.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Sứ mệnh ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div ref={r3.ref} style={r3.revealStyle} className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div ref={img2.wrapRef} className="overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <img src={suMenh} alt="Sứ mệnh Coffea" style={img2.imgStyle} />
          </div>
          <div>
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Mục tiêu
            </p>
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>
              Sứ mệnh của chúng tôi
            </h2>
            <div className="flex flex-col gap-5">
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Coffea mong muốn lan tỏa văn hóa thưởng thức cà phê chất lượng đến nhiều người hơn. Mỗi sản phẩm tại Coffea đều được tạo ra với sự cân bằng giữa hương vị, cảm xúc và trải nghiệm.
              </p>
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Chúng tôi không chỉ bán cà phê, mà còn tạo nên một không gian nơi khách hàng có thể kết nối với bản thân, với bạn bè và với những câu chuyện đời thường.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Giá trị cốt lõi ── */}
      <div className="bg-cafe-primary py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div ref={r4.ref} style={r4.revealStyle} className="text-center mb-14">
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(241,240,238,0.55)", textTransform: "uppercase", marginBottom: 12 }}>
              Nền tảng
            </p>
            <h2 className="font-heading text-cafe-bg" style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 700 }}>
              Điều làm nên Coffea
            </h2>
          </div>
          <div ref={r5.ref} style={r5.revealStyle} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Chất lượng trong từng ly cà phê",
                desc: "Chúng tôi lựa chọn hạt cà phê kỹ lưỡng, chú trọng quy trình rang xay và pha chế để giữ được hương vị đặc trưng nhất.",
              },
              {
                title: "Tận tâm trong phục vụ",
                desc: "Mỗi khách hàng đến Coffea đều được chào đón bằng sự thân thiện, chu đáo và chân thành.",
              },
              {
                title: "Không gian ấm áp, gần gũi",
                desc: "Coffea được thiết kế như một nơi để bạn có thể chậm lại, tận hưởng hương cà phê và tìm thấy cảm giác thoải mái.",
              },
              {
                title: "Tôn trọng giá trị nguyên bản",
                desc: "Chúng tôi đề cao hương vị tự nhiên của cà phê, hạn chế sự phức tạp không cần thiết và tập trung vào trải nghiệm thật.",
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-4">
                <h3 className="font-heading text-cafe-bg" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>
                  {item.title}
                </h3>
                <p className="font-body" style={{ fontSize: 13.5, color: "rgba(241,240,238,0.7)", lineHeight: 1.85 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. Hạt cà phê & quy trình ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div ref={r6.ref} style={r6.revealStyle} className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Quy trình
            </p>
            <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>
              Từ hạt cà phê đến trải nghiệm
            </h2>
            <div className="flex flex-col gap-5">
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Mỗi hạt cà phê tại Coffea đều được chọn lọc cẩn thận nhằm đảm bảo độ tươi, hương thơm và hậu vị cân bằng. Quá trình rang được kiểm soát phù hợp với từng dòng hạt để làm nổi bật những tầng hương riêng biệt.
              </p>
              <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Từ espresso đậm đà, latte mềm mại đến cold brew thanh mát, Coffea luôn hướng đến việc mang lại hương vị hài hòa và dễ thưởng thức cho nhiều gu cà phê khác nhau.
              </p>
            </div>
          </div>
          <div ref={img3.wrapRef} className="overflow-hidden" style={{ aspectRatio: "4/3" }}>
            <img src={hatCaPhe} alt="Hạt cà phê Coffea" style={img3.imgStyle} />
          </div>
        </div>
      </div>

      {/* ── 7. Không gian quán ── */}
      <div className="bg-cafe-accent py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div ref={r7.ref} style={r7.revealStyle} className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div ref={img4.wrapRef} className="overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <img src={khongGian} alt="Không gian Coffea" style={img4.imgStyle} />
            </div>
            <div>
              <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
                Không gian
              </p>
              <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>
                Một góc nhỏ cho những phút chậm lại
              </h2>
              <div className="flex flex-col gap-5">
                <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                  Coffea không chỉ là nơi để uống cà phê, mà còn là nơi để bạn nghỉ ngơi, làm việc, đọc sách hoặc gặp gỡ bạn bè. Không gian được thiết kế tối giản, ấm cúng và yên tĩnh, tạo cảm giác dễ chịu trong từng khoảnh khắc ghé thăm.
                </p>
                <p className="font-body" style={{ fontSize: 14, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                  Dù là buổi sáng bắt đầu ngày mới hay một buổi chiều cần chút bình yên, Coffea luôn sẵn sàng đồng hành cùng bạn bằng một ly cà phê thơm và một không gian vừa đủ thân quen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. Cam kết thương hiệu ── */}
      <div className="max-w-[800px] mx-auto px-6 py-20 text-center">
        <div ref={r8.ref} style={r8.revealStyle}>
          <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
            Cam kết
          </p>
          <h2 className="font-heading text-cafe-primary" style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 700, marginBottom: 24 }}>
            Coffea cam kết
          </h2>
          <div className="flex flex-col gap-5">
            <p className="font-body" style={{ fontSize: 15, color: "rgba(48,38,28,0.75)", lineHeight: 2 }}>
              Coffea luôn nỗ lực duy trì chất lượng ổn định trong từng sản phẩm, phục vụ khách hàng bằng sự chỉn chu và không ngừng cải thiện trải nghiệm mỗi ngày.
            </p>
            <p className="font-body" style={{ fontSize: 15, color: "rgba(48,38,28,0.75)", lineHeight: 2 }}>
              Chúng tôi tin rằng sự hài lòng của khách hàng không đến từ những điều lớn lao, mà từ những chi tiết nhỏ được làm tốt một cách đều đặn.
            </p>
          </div>
        </div>
      </div>

      {/* ── 9. CTA cuối trang ── */}
      <div className="bg-cafe-primary py-20 px-6 text-center">
        <h2 className="font-heading text-cafe-bg" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 700, marginBottom: 16 }}>
          Ghé Coffea và cảm nhận theo cách của bạn
        </h2>
        <p className="font-body" style={{ fontSize: 15, color: "rgba(241,240,238,0.75)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 36px" }}>
          Mỗi người có một gu cà phê riêng, và Coffea luôn sẵn sàng cùng bạn tìm ra hương vị phù hợp nhất.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/menu"
            className="font-body bg-cafe-bg text-cafe-primary rounded-full px-10 py-4 hover:brightness-95 transition-all"
            style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.5px" }}
          >
            Khám phá menu
          </Link>
        </div>
      </div>

    </div>
  );
}
