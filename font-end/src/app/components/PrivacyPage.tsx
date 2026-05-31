import { Link } from "react-router";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cafe-bg">
      {/* Header */}
      <div className="bg-cafe-primary text-cafe-bg py-24 px-6 text-center">
        <p className="font-alt uppercase tracking-[4px] mb-3" style={{ fontSize: 13, opacity: 0.75 }}>Coffea</p>
        <h1 className="font-heading" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700 }}>
          Chính sách bảo mật
        </h1>
        <p className="font-body mt-4" style={{ fontSize: 14, opacity: 0.7 }}>
          Cập nhật lần cuối: 30/05/2026
        </p>
      </div>

      {/* Content */}
      <div className="max-w-[760px] mx-auto px-6 py-14">
        <div className="flex flex-col gap-10 font-body text-cafe-primary" style={{ lineHeight: 1.8 }}>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Cam kết bảo mật</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Coffea cam kết bảo vệ quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Thông tin chúng tôi thu thập</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", marginBottom: 10 }}>
              Chúng tôi thu thập các thông tin sau khi bạn sử dụng dịch vụ:
            </p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: 20 }}>
              {[
                "Thông tin định danh: họ tên, tên đăng nhập, địa chỉ email",
                "Thông tin liên lạc: số điện thoại",
                "Thông tin đơn hàng: lịch sử mua hàng, sản phẩm yêu thích",
                "Thông tin thanh toán: phương thức thanh toán (không lưu số thẻ)",
                "Thông tin kỹ thuật: địa chỉ IP, loại trình duyệt, thời gian truy cập",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", listStyleType: "disc" }}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. Mục đích sử dụng thông tin</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", marginBottom: 10 }}>
              Thông tin thu thập được sử dụng để:
            </p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: 20 }}>
              {[
                "Xử lý và xác nhận đơn hàng của bạn",
                "Gửi thông báo về trạng thái đơn hàng",
                "Quản lý tài khoản và điểm thưởng",
                "Cải thiện chất lượng dịch vụ và trải nghiệm người dùng",
                "Gửi thông tin khuyến mãi (nếu bạn đồng ý)",
                "Tuân thủ nghĩa vụ pháp lý",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", listStyleType: "disc" }}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Bảo vệ thông tin</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, mất mát hoặc tiết lộ. Mật khẩu được mã hóa bằng thuật toán bcrypt và không được lưu dưới dạng văn bản thường. Kết nối được bảo vệ bằng HTTPS.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Chia sẻ thông tin với bên thứ ba</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ với:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: 20 }}>
              {[
                "Đối tác thanh toán (MoMo, VietQR) — để xử lý giao dịch",
                "Cơ quan nhà nước — khi có yêu cầu pháp lý",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", listStyleType: "disc" }}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Quyền của bạn</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", marginBottom: 10 }}>
              Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
            </p>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: 20 }}>
              {[
                "Quyền truy cập: xem thông tin cá nhân đang được lưu trữ",
                "Quyền chỉnh sửa: cập nhật thông tin không chính xác",
                "Quyền xóa: yêu cầu xóa tài khoản và dữ liệu liên quan",
                "Quyền từ chối: không nhận email marketing",
                "Quyền di chuyển dữ liệu: nhận bản sao dữ liệu của bạn",
              ].map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "rgba(48,38,28,0.8)", listStyleType: "disc" }}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. Cookie</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Chúng tôi sử dụng cookie và các công nghệ tương tự để duy trì phiên đăng nhập, ghi nhớ tùy chọn của bạn và phân tích lưu lượng truy cập. Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Thời gian lưu trữ</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Thông tin cá nhân được lưu trữ trong suốt thời gian tài khoản còn hoạt động. Sau khi xóa tài khoản, dữ liệu sẽ được xóa trong vòng 30 ngày, trừ các dữ liệu cần giữ lại theo yêu cầu pháp lý.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>9. Liên hệ</h2>
            <p style={{ fontSize: 14, color: "rgba(48,38,28,0.8)" }}>
              Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện các quyền của mình, vui lòng liên hệ:{" "}
              <Link to="/contact" className="text-cafe-primary hover:opacity-70 transition-opacity" style={{ fontWeight: 600, textDecoration: "underline" }}>
                Trang liên hệ
              </Link>{" "}
              hoặc email <span style={{ fontWeight: 600 }}>privacy@coffea.vn</span>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
