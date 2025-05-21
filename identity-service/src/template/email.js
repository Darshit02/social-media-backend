const passwordResetTemplate = (name, resetURL) => `
  <html>
  <body style="margin:0; padding:0; background:#f7f7f7; font-family:'Segoe UI', sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 50px 0;">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:15px; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" style="padding: 30px 20px; background:linear-gradient(135deg, #6e8efb, #a777e3); color:#ffffff;">
                <h1 style="margin:0; font-size:32px;">🔐 Password Reset</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; color:#333333; text-align:center;">
                <p style="font-size:18px; margin: 0 0 20px;">Hello <strong>${name}</strong>,</p>
                <p style="font-size:16px; line-height:1.5; margin:0 0 20px;">
                  We received a request to reset your password. Click the button below to set a new one.
                </p>
                <a href="${resetURL}" style="
                  display:inline-block;
                  margin:20px 0;
                  padding:14px 30px;
                  background:#6e8efb;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-size:18px;
                  transition:all 0.3s ease-in-out;
                " onmouseover="this.style.background='#a777e3';">
                  🔒 Reset Password
                </a>
                <p style="font-size:14px; color:#888888; margin-top:30px;">
                  If you didn't request this, please ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f1f1f1; padding:20px; text-align:center; font-size:12px; color:#aaaaaa;">
                &copy; ${new Date().getFullYear()} YourApp Inc. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

module.exports = passwordResetTemplate;
