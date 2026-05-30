import { Link } from "react-router";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cafe-bg">
      {/* Header */}
      <div className="bg-cafe-primary text-cafe-bg py-24 px-6 text-center">
        <p className="font-alt uppercase tracking-[4px] mb-3" style={{ fontSize: 13, opacity: 0.75 }}>Coffea</p>
        <h1 className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700 }}>
          Điều khoản dịch vụ
        </h1>
        <p className="font-body mt-4" style={{ fontSize: 14, opacity: 0.7 }}>
          Cập nhật lần cuối: 30/05/2026
        </p>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <div className="flex flex-col gap-10 font-body text-cafe-primary" style={{ lineHeight: 1.8 }}>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Chấp nhận điều khoản</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Bằng cách truy cập hoặc sử dụng dịch vụ của Coffea, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý tuân thủ các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Mô tả dịch vụ</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Coffea cung cấp nền tảng đặt hàng đồ uống và thực phẩm trực tuyến, bao gồm các tính năng:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: 20 }}>
              {[
                "Duyệt thực đơn và đặt hàng trực tuyến",
                "Thanh toán qua nhiều phương thức (tiền mặt, MoMo, QR)",
                "Tích lũy và đổi điểm thưởng",
                "Theo dõi lịch sử đơn hàng",
                "Áp dụng mã khuyến mãi và giảm giá",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", listStyleType: "disc" }}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Tài khoản người dùng</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Để sử dụng đầy đủ tính năng, bạn cần tạo tài khoản với thông tin chính xác và cập nhật. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Coffea có quyền tạm khóa hoặc xóa tài khoản vi phạm điều khoản.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Quy định đặt hàng và thanh toán</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Tất cả đơn hàng phải được thanh toán đầy đủ. Giá hiển thị trên ứng dụng đã bao gồm VAT. Coffea có quyền từ chối hoặc hủy đơn hàng trong trường hợp hàng hóa không còn sẵn có hoặc phát hiện gian lận. Hoàn tiền sẽ được xử lý theo chính sách hoàn tiền hiện hành.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Chương trình điểm thưởng</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Điểm thưởng được tích lũy theo mỗi đơn hàng hoàn thành và có thể quy đổi thành ưu đãi. Điểm thưởng không có giá trị tiền mặt, không được chuyển nhượng và có thể thay đổi theo chính sách cập nhật của Coffea. Coffea có quyền điều chỉnh tỷ lệ tích điểm mà không cần thông báo trước.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Quyền sở hữu trí tuệ</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Toàn bộ nội dung trên nền tảng Coffea bao gồm logo, hình ảnh, văn bản, giao diện và mã nguồn đều thuộc quyền sở hữu của Coffea. Nghiêm cấm sao chép, phân phối hoặc sử dụng thương mại mà không có sự cho phép bằng văn bản.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. Giới hạn trách nhiệm</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Coffea không chịu trách nhiệm về các thiệt hại gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng dịch vụ. Trách nhiệm tối đa của Coffea trong mọi trường hợp không vượt quá giá trị đơn hàng liên quan.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Thay đổi điều khoản</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Coffea có quyền cập nhật các điều khoản này bất cứ lúc nào. Thay đổi sẽ có hiệu lực ngay khi đăng tải lên nền tảng. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được xem là đồng ý với điều khoản mới.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>9. Liên hệ</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Mọi câu hỏi về Điều khoản dịch vụ, vui lòng liên hệ:{" "}
              <Link to="/contact" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>
                Trang liên hệ
              </Link>{" "}
              hoặc email <span style={{ fontWeight: 600 }}>support@coffea.vn</span>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
