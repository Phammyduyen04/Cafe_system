import { ABOUT_HERO, ABOUT_INTERIOR } from "../../constants/images";

// TODO: Fetch about page content (values, team, stats) from backend API

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
                Coffea ra đời từ niềm đam mê cà phê specialty, mong muốn chia sẻ hương vị cà phê chất lượng cao với cộng đồng.
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
          </div>
        </div>
      </div>

    </div>
  );
}
