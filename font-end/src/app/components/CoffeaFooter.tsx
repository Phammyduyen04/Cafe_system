import svgPaths from "../../constants/svg-paths";

export default function CoffeaFooter() {
  const footerColumns = [
    { heading: "Chính sách", links: ["Điều khoản sử dụng", "Chính sách bảo mật", "Cookies"] },
    { heading: "Dịch vụ", links: ["Cửa hàng", "Đặt hàng trước", "Thực đơn"] },
    { heading: "Về chúng tôi", links: ["Tìm chi nhánh", "Giới thiệu", "Câu chuyện của chúng tôi"] },
    { heading: "Thông tin", links: ["Bảng giá", "Bán sản phẩm", "Tuyển dụng"] },
  ];

  return (
    <footer className="bg-cafe-primary text-white pt-12 md:pt-14 pb-8 px-6 sm:px-10 md:px-16">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-10">
        {/* Logo */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 mb-2">
          <span className="font-heading" style={{ fontWeight: 700, fontSize: 28 }}>
            <span style={{ fontSize: 36 }}>C</span>offea
          </span>
          <p className="font-body mt-2 text-white/50" style={{ fontSize: 12, lineHeight: 1.6 }}>
            Hương vị đặc trưng,<br />trải nghiệm khó quên.
          </p>
        </div>

        {/* Links */}
        {footerColumns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-3">
            <h4
              className="font-body uppercase"
              style={{ fontWeight: 500, fontSize: "clamp(12px, 1.2vw, 17px)", color: "white" }}
            >
              {col.heading}
            </h4>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="font-body text-white/70 hover:text-white transition-colors"
                style={{ fontWeight: 400, fontSize: "clamp(12px, 1vw, 14px)" }}
              >
                {link}
              </a>
            ))}
          </div>
        ))}

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
