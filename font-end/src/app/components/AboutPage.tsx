import { ABOUT_HERO, ABOUT_BEANS, ABOUT_INTERIOR, ABOUT_TEAM } from "../../constants/images";

const values = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: "Tươi mỗi ngày",
    desc: "Hạt cà phê được rang mới mỗi sáng, đảm bảo hương vị tươi ngon nhất cho từng tách.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: "Tận tâm phục vụ",
    desc: "Chúng tôi tin rằng mỗi khách hàng xứng đáng được trải nghiệm dịch vụ ân cần và chu đáo nhất.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    ),
    title: "Không gian thư giãn",
    desc: "Thiết kế ấm cúng, âm nhạc nhẹ nhàng — nơi lý tưởng để làm việc, gặp gỡ hay đơn giản là thư giãn.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Nguồn gốc bền vững",
    desc: "Hợp tác trực tiếp với các nông trại có chứng nhận, đảm bảo chuỗi cung ứng minh bạch và công bằng.",
  },
];

const team = [
  { name: "Lê Minh Khôi", role: "Sáng lập & Head Barista", img: ABOUT_TEAM },
  { name: "Nguyễn Thảo Linh", role: "Quản lý vận hành", img: ABOUT_INTERIOR },
  { name: "Trần Đức Huy", role: "Chuyên gia rang xay", img: ABOUT_BEANS },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cafe-bg">

      {/* ── Hero ── */}
      <div className="relative h-[480px] md:h-[560px] overflow-hidden">
        <img src={ABOUT_HERO} alt="Coffea" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-cafe-primary/55" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-body" style={{ fontSize: 12, letterSpacing: "4px", color: "rgba(241,240,238,0.7)", textTransform: "uppercase", marginBottom: 14 }}>
            Câu chuyện của chúng tôi
          </p>
          <h1 className="font-body" style={{ fontSize: 48, fontWeight: 700, color: "var(--cafe-bg)", letterSpacing: "2px", lineHeight: 1.15 }}>
            Về Coffea
          </h1>
          <div className="w-12 h-px bg-cafe-accent mt-5 mx-auto" />
        </div>
      </div>

      {/* ── Story Section ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Khởi nguồn
            </p>
            <h2 className="font-body text-cafe-primary" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>
              Bắt đầu từ một tình yêu với cà phê
            </h2>
            <div className="flex flex-col gap-4">
              <p className="font-body" style={{ fontSize: 13.5, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Coffea ra đời năm 2018 từ một góc nhỏ tại Hà Nội, khi người sáng lập Lê Minh Khôi quyết định chia sẻ niềm đam mê cà phê specialty với cộng đồng. Khởi đầu chỉ với một chiếc máy pha cà phê và vài bộ bàn ghế gỗ mộc mạc, Coffea nhanh chóng trở thành điểm hẹn quen thuộc của những ai yêu hương vị cà phê chất lượng cao.
              </p>
              <p className="font-body" style={{ fontSize: 13.5, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Hơn 6 năm phát triển, chúng tôi vẫn giữ nguyên triết lý ban đầu: mỗi tách cà phê là một tác phẩm — được chọn lựa, rang xay và pha chế với tất cả sự tỉ mỉ và tình yêu nghề.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src={ABOUT_INTERIOR}
              alt="Không gian Coffea"
              className="w-full object-cover"
              style={{ aspectRatio: "4/3" }}
            />
            <div
              className="absolute -bottom-5 -left-5 w-32 h-32 hidden md:flex items-center justify-center bg-cafe-primary"
            >
              <div className="text-center">
                <p className="font-body" style={{ fontSize: 28, fontWeight: 700, color: "var(--cafe-bg)", lineHeight: 1 }}>6+</p>
                <p className="font-body" style={{ fontSize: 10, color: "rgba(241,240,238,0.7)", letterSpacing: "1px", marginTop: 4 }}>NĂM KINH NGHIỆM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-cafe-primary">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: "6+", label: "Năm hoạt động" },
              { num: "3", label: "Chi nhánh" },
              { num: "50K+", label: "Khách hàng" },
              { num: "20+", label: "Loại cà phê" },
            ].map(({ num, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <p className="font-body" style={{ fontSize: 36, fontWeight: 700, color: "var(--cafe-bg)", lineHeight: 1 }}>{num}</p>
                <p className="font-body" style={{ fontSize: 11, letterSpacing: "2px", color: "rgba(241,240,238,0.55)", textTransform: "uppercase" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Values ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-14">
          <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 10 }}>
            Giá trị cốt lõi
          </p>
          <h2 className="font-body text-cafe-primary" style={{ fontSize: 30, fontWeight: 700 }}>Những điều chúng tôi tin tưởng</h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {values.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-start gap-4 p-6 border border-cafe-accent transition-shadow hover:shadow-md"
              style={{ background: "rgba(255,255,255,0.5)" }}
            >
              <div className="text-cafe-primary">{icon}</div>
              <p className="font-body text-cafe-primary" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.5px" }}>{title}</p>
              <p className="font-body" style={{ fontSize: 12.5, color: "rgba(48,38,28,0.65)", lineHeight: 1.8 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Beans Section ── */}
      <div className="bg-cafe-accent">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="order-2 md:order-1">
              <img src={ABOUT_BEANS} alt="Cà phê" className="w-full object-cover" style={{ aspectRatio: "4/3" }} />
            </div>
            <div className="order-1 md:order-2">
              <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
                Nguyên liệu
              </p>
              <h2 className="font-body text-cafe-primary" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.3, marginBottom: 20 }}>
                Hạt cà phê từ những vùng đất tốt nhất
              </h2>
              <p className="font-body" style={{ fontSize: 13.5, color: "rgba(48,38,28,0.75)", lineHeight: 1.9 }}>
                Chúng tôi làm việc trực tiếp với các nông trại tại Đà Lạt, Buôn Ma Thuột và các vùng trồng cà phê nổi tiếng thế giới. Mỗi lô hàng đều được kiểm định chất lượng nghiêm ngặt trước khi đến tay barista.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                {["Arabica cao nguyên Đà Lạt", "Robusta Buôn Ma Thuột", "Blend đặc biệt của Coffea"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-cafe-primary" />
                    <span className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.8)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Team ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div className="text-center mb-14">
          <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 10 }}>
            Con người
          </p>
          <h2 className="font-body text-cafe-primary" style={{ fontSize: 30, fontWeight: 700 }}>Đội ngũ của chúng tôi</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {team.map(({ name, role, img }) => (
            <div key={name} className="flex flex-col">
              <div className="overflow-hidden" style={{ aspectRatio: "3/4" }}>
                <img
                  src={img}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="pt-4 pb-2">
                <p className="font-body text-cafe-primary" style={{ fontSize: 14, fontWeight: 600 }}>{name}</p>
                <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.55)", marginTop: 3 }}>{role}</p>
              </div>
              <div className="h-px bg-cafe-border mt-1" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
