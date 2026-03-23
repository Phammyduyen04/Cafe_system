import { useState } from "react";

// TODO: Fetch branches and topics from backend API
interface Branch {
  name: string;
  address: string;
  hours: string;
  phone: string;
  mapSrc: string;
}

export default function ContactPage() {
  // TODO: Fetch from backend API
  const [branches] = useState<Branch[]>([]);
  const [topics] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setName(""); setEmail(""); setMessage("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-cafe-bg">

      {/* ── Hero ── */}
      <div
        className="flex flex-col items-center justify-center text-center px-6 py-24 bg-cafe-primary"
      >
        <p className="font-body" style={{ fontSize: 11, letterSpacing: "4px", color: "rgba(241,240,238,0.55)", textTransform: "uppercase", marginBottom: 14 }}>
          Kết nối với chúng tôi
        </p>
        <h1 className="font-body" style={{ fontSize: 46, fontWeight: 700, color: "var(--cafe-bg)", letterSpacing: "2px" }}>Liên hệ</h1>
        <div className="w-12 h-px bg-cafe-accent mt-5" />
        <p className="font-body" style={{ fontSize: 13.5, color: "rgba(241,240,238,0.65)", marginTop: 16, maxWidth: 480, lineHeight: 1.8 }}>
          Chúng tôi luôn sẵn lòng lắng nghe — dù bạn muốn đặt bàn, chia sẻ cảm nhận hay bắt đầu một hợp tác mới.
        </p>
      </div>

      {/* ── Quick Info Cards ── */}
      {branches.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-14">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.7a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                ),
                label: "Điện thoại",
                value: branches[0]?.phone ?? "",
                sub: branches[0]?.hours ?? "",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                ),
                label: "Email",
                value: "",
                sub: "",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                ),
                label: "Chi nhánh",
                value: `${branches.length} địa điểm`,
                sub: branches.map(b => b.name).join(" · "),
              },
            ].map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-3 p-6 border border-cafe-accent"
                style={{ background: "rgba(255,255,255,0.5)" }}
              >
                <div className="text-cafe-primary">{icon}</div>
                <div>
                  <p className="font-body" style={{ fontSize: 10, letterSpacing: "2px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase" }}>{label}</p>
                  <p className="font-body text-cafe-primary" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{value}</p>
                  <p className="font-body" style={{ fontSize: 12, color: "rgba(48,38,28,0.5)", marginTop: 2 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Branches + Map ── */}
      <div className="bg-cafe-accent">

      </div>

      {/* ── Contact Form ── */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-2 gap-14 md:gap-20 items-start">
          {/* Left info */}
          <div>
            <p className="font-body" style={{ fontSize: 11, letterSpacing: "3px", color: "rgba(48,38,28,0.5)", textTransform: "uppercase", marginBottom: 14 }}>
              Gửi tin nhắn
            </p>
            <h2 className="font-body text-cafe-primary" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
              Chúng tôi muốn nghe từ bạn
            </h2>
            <p className="font-body" style={{ fontSize: 13.5, color: "rgba(48,38,28,0.65)", lineHeight: 1.9, marginBottom: 28 }}>
              Dù bạn có câu hỏi về thực đơn, muốn đặt chỗ cho sự kiện riêng, hay chỉ đơn giản muốn chia sẻ cảm nhận — hãy điền vào form và chúng tôi sẽ liên hệ lại sớm nhất có thể.
            </p>
          </div>

          {/* Form */}
          <div
            className="p-8 border border-cafe-accent"
            style={{ background: "rgba(255,255,255,0.5)" }}
          >
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="w-14 h-14 flex items-center justify-center bg-cafe-primary">
                  <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                    <path d="M2 9L9 16L22 2" stroke="var(--cafe-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="font-body text-cafe-primary" style={{ fontSize: 15, fontWeight: 600 }}>Gửi thành công!</p>
                <p className="font-body" style={{ fontSize: 13, color: "rgba(48,38,28,0.6)" }}>Chúng tôi sẽ phản hồi trong vòng 24 giờ.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name + Email row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>Họ tên</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                      className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                      style={{ fontSize: 13, borderRadius: 0 }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                      style={{ fontSize: 13, borderRadius: 0 }}
                    />
                  </div>
                </div>

                {/* Topic */}
                {topics.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>Chủ đề</label>
                    <div className="relative">
                      <select
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        className="font-body w-full border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors text-cafe-primary appearance-none"
                        style={{ fontSize: 13, borderRadius: 0 }}
                      >
                        {topics.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[rgba(48,38,28,0.4)]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-cafe-primary" style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.5px", textTransform: "uppercase" }}>Nội dung</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn của bạn..."
                    rows={5}
                    required
                    className="font-body w-full resize-none border border-cafe-border bg-white px-4 py-3 outline-none focus:border-cafe-primary transition-colors placeholder:text-[rgba(48,38,28,0.3)] text-cafe-primary"
                    style={{ fontSize: 13, borderRadius: 0 }}
                  />
                </div>

                <button
                  type="submit"
                  className="font-body w-full py-3.5 mt-1 bg-cafe-primary text-cafe-bg transition-all duration-200 hover:brightness-90 active:scale-[0.98]"
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: "2.5px",
                  }}
                >
                  GỬI TIN NHẮN
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
