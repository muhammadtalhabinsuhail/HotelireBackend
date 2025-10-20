// /utils/sendMail.js
import nodemailer from "nodemailer";



function verificationEmailTemplate(code) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <style>
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f7f5ff;
        color: #333;
      }

      .container {
        max-width: 500px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 15px rgba(128, 0, 128, 0.2);
        overflow: hidden;
        border: 1px solid #e3d9ff;
      }

      .header {
        background: linear-gradient(135deg, #6a1b9a, #8e24aa);
        color: white;
        text-align: center;
        padding: 25px 10px;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
      }

      .content {
        padding: 30px 25px;
        text-align: center;
      }

      .content p {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 25px;
      }

      .code-box {
        background: #f3e5f5;
        color: #4a148c;
        font-size: 28px;
        letter-spacing: 5px;
        font-weight: bold;
        padding: 15px 0;
        border-radius: 10px;
        display: inline-block;
        width: 200px;
      }

      .footer {
        background: #f9f5ff;
        color: #6a1b9a;
        text-align: center;
        font-size: 14px;
        padding: 15px;
        border-top: 1px solid #eee;
      }

      a {
        color: #8e24aa;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Hotelier</h1>
        <p>Your perfect stay is one click away!</p>
      </div>

      <div class="content">
        <p>Thank you for signing up with <strong>Hotelier</strong>!<br>
        Please use the following verification code to confirm your email:</p>

        <div class="code-box">${code}</div>

        <p>This code will expire in <strong>10 minutes</strong>.</p>
      </div>

      <div class="footer">
        <p>© ${new Date().getFullYear()} Hotelier. All rights reserved.<br>
        Need help? <a href="mailto:support@hotelier.com">Contact Support</a></p>
      </div>
    </div>
  </body>
  </html>
  `;
}











export const sendEmail = async (to, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Hotelier (Your perfect stay, Is one click away)" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Your Verification Code",
    html: verificationEmailTemplate(code),
    // text: `Your 4-digit verification code is:  ${code}   `,
  };

  await transporter.sendMail(mailOptions);
};


//logo, datetime, footer (Hotelire)