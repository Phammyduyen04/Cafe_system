const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendResetCode = async (toEmail, code) => {
  await transporter.sendMail({
    from: `"Coffea" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: 'Mã đặt lại mật khẩu - Coffea',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #30261C;">Đặt lại mật khẩu</h2>
        <p>Mã xác nhận của bạn là:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                    background: #F1F0EE; padding: 16px; text-align: center; margin: 16px 0;">
          ${code}
        </div>
        <p>Mã này sẽ hết hạn sau 15 phút.</p>
        <p style="color: #888; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      </div>
    `,
  });
};

module.exports = { sendResetCode };
