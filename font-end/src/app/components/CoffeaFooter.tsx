import { Link } from "react-router";
import svgPaths from "../../constants/svg-paths";

// TODO: Fetch footer links from backend API or CMS

export default function CoffeaFooter() {
  return (
    <footer className="bg-cafe-primary text-white pt-12 md:pt-14 pb-8 px-6 sm:px-10 md:px-16">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-10">
        {/* Logo */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-2">
          <span className="font-heading" style={{ fontWeight: 700, fontSize: 28 }}>
            <span style={{ fontSize: 36 }}>C</span>offea
          </span>
          <p className="font-body mt-2 text-white/50" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Hương vị đặc trưng,<br />trải nghiệm khó quên.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3">
          <h4
            className="font-body uppercase"
            style={{ fontWeight: 500, fontSize: "clamp(12px, 1.2vw, 17px)", color: "white" }}
          >
            Điều hướng
          </h4>
          <Link to="/" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Trang chủ
          </Link>
          <Link to="/menu" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Thực đơn
          </Link>
          <Link to="/about" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Giới thiệu
          </Link>
          <Link to="/contact" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Liên hệ
          </Link>
        </div>

        {/* Account */}
        <div className="flex flex-col gap-3">
          <h4
            className="font-body uppercase"
            style={{ fontWeight: 500, fontSize: "clamp(12px, 1.2vw, 17px)", color: "white" }}
          >
            Tài khoản
          </h4>
          <Link to="/login" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Đăng nhập
          </Link>
          <Link to="/register" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Đăng ký
          </Link>
          <Link to="/profile" className="font-body text-white/70 hover:text-white transition-colors" style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}>
            Hồ sơ
          </Link>
        </div>

        {/* Social Media */}
        <div className="flex flex-col gap-4 col-span-2 sm:col-span-1">
          <h4 className="font-body uppercase" style={{ fontWeight: 500, fontSize: "clamp(12px, 1.2vw, 17px)", color: "white" }}>
            Mạng xã hội
          </h4>
          <div className="flex gap-4 flex-wrap">
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Twitter">
              <svg width="22" height="22" viewBox="0 0 24 21.7509" fill="none">
                <path d={svgPaths.twitter} fill="white" />
              </svg>
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d={svgPaths.instagramRect} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d={svgPaths.instagramCircle} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                <path d="M17.5 6.50439H17.51" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="Facebook">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d={svgPaths.facebook} fill="white" />
              </svg>
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity" aria-label="LinkedIn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path clipRule="evenodd" d={svgPaths.linkedin} fill="white" fillRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto mt-10 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
          © 2026 Coffea. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
