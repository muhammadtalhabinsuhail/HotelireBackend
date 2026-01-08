// // /utils/sendMail.js
// import nodemailer from "nodemailer";



// function verificationEmailTemplate(code) {
//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>Email Verification</title>
//   <style>
//     * {
//       margin: 0;
//       padding: 0;
//       box-sizing: border-box;
//     }

//     body {
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
//       background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
//       color: #2c3e50;
//       line-height: 1.6;
//       padding: 20px;
//     }

//     .wrapper {
//       max-width: 600px;
//       margin: 0 auto;
//     }

//     .container {
//       background: #ffffff;
//       border-radius: 20px;
//       box-shadow: 0 10px 40px rgba(89, 165, 178, 0.12);
//       overflow: hidden;
//       border: 1px solid rgba(89, 165, 178, 0.1);
//     }

// /* Header Section */
//     .header {
//       background: #ffffff;
//       color: #2c3e50;
//       text-align: center;
//       padding: 40px 30px;
//       position: relative;
//       overflow: hidden;
//       border-bottom: 3px solid #59A5B2;
//     }

//     .header::before {
//       content: '';
//       position: absolute;
//       top: -50%;
//       right: -10%;
//       width: 300px;
//       height: 300px;
//       background: rgba(89, 165, 178, 0.08);
//       border-radius: 50%;
//     }

//     /* Added logo styling */
//     .header-logo {
//       max-width: 180px;
//       height: auto;
//       margin: 0 auto 20px;
//       display: block;
//     }

//     .header h1 {
//       font-size: 28px;
//       font-weight: 700;
//       margin-bottom: 8px;
//       letter-spacing: -0.5px;
//       color: #2c3e50;
//     }

//     .header p {
//       font-size: 14px;
//       color: #59A5B2;
//       font-weight: 500;
//     }


//     /* Content Section */
//     .content {
//       padding: 45px 30px;
//       text-align: center;
//     }

//     .content-title {
//       font-size: 20px;
//       font-weight: 600;
//       color: #2c3e50;
//       margin-bottom: 15px;
//     }

//     .content-text {
//       font-size: 15px;
//       color: #555;
//       margin-bottom: 35px;
//       line-height: 1.7;
//     }

//     .content-text strong {
//       color: #59A5B2;
//       font-weight: 600;
//     }

//     /* Code Box */
//     .code-section {
//       margin: 35px 0;
//     }

//     .code-label {
//       font-size: 12px;
//       text-transform: uppercase;
//       letter-spacing: 1px;
//       color: #59A5B2;
//       font-weight: 700;
//       margin-bottom: 12px;
//       display: block;
//     }

//     .code-box {
//       background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
//       border: 2px solid #59A5B2;
//       color: #59A5B2;
//       font-size: 36px;
//       letter-spacing: 8px;
//       font-weight: 700;
//       padding: 25px;
//       border-radius: 15px;
//       display: inline-block;
//       font-family: 'Courier New', monospace;
//       box-shadow: 0 4px 15px rgba(89, 165, 178, 0.1);
//       transition: all 0.3s ease;
//     }

//     .code-box:hover {
//       box-shadow: 0 8px 25px rgba(89, 165, 178, 0.2);
//       transform: translateY(-2px);
//     }

//     /* Info Section */
//     .info-section {
//       background: #f8fafb;
//       border-left: 4px solid #59A5B2;
//       padding: 20px;
//       border-radius: 10px;
//       margin: 30px 0;
//       text-align: left;
//     }

//     .info-item {
//       display: flex;
//       align-items: flex-start;
//       margin-bottom: 16px;
//       font-size: 14px;
//       color: #555;
//       gap: 12px;
//     }

//     .info-item:last-child {
//       margin-bottom: 0;
//     }

//     /* Improved info-icon styling for proper alignment */
//     .info-icon {
//       width: 32px;
//       height: 32px;
//       background: #59A5B2;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: white;
//       font-size: 16px;
//       flex-shrink: 0;
//       font-weight: bold;
//       margin-top: 2px;
//     }

//     .info-text {
//       flex: 1;
//       padding-top: 2px;
//     }

//     .info-text strong {
//       color: #2c3e50;
//       display: block;
//       margin-bottom: 3px;
//       font-weight: 600;
//     }

//     /* Footer Section */
//     .footer {
//       background: #f8fafb;
//       color: #666;
//       text-align: center;
//       font-size: 13px;
//       padding: 30px;
//       border-top: 1px solid #e8e8e8;
//     }

//     .footer-content {
//       margin-bottom: 15px;
//     }

//     .footer-links {
//       display: flex;
//       justify-content: center;
//       gap: 20px;
//       flex-wrap: wrap;
//       margin-top: 15px;
//     }

//     .footer-link {
//       color: #59A5B2;
//       text-decoration: none;
//       font-weight: 500;
//       transition: color 0.3s ease;
//     }

//     .footer-link:hover {
//       color: #4a8a99;
//       text-decoration: underline;
//     }

//     .footer-divider {
//       color: #ddd;
//       margin: 0 5px;
//     }

//     .copyright {
//       color: #999;
//       font-size: 12px;
//       margin-top: 15px;
//     }

//     /* Mobile Responsive */
//     @media (max-width: 600px) {
//       body {
//         padding: 15px;
//       }

//       .container {
//         border-radius: 16px;
//       }

//       .header {
//         padding: 30px 20px;
//       }

//       /* Mobile logo sizing */
//       .header-logo {
//         max-width: 150px;
//         margin: 0 auto 15px;
//       }

//       .header h1 {
//         font-size: 24px;
//       }

//       .content {
//         padding: 30px 20px;
//       }

//       .content-title {
//         font-size: 18px;
//       }

//       .content-text {
//         font-size: 14px;
//       }

//       .code-box {
//         font-size: 28px;
//         letter-spacing: 6px;
//         padding: 20px;
//       }

//       .info-section {
//         padding: 15px;
//       }

//       .info-item {
//         margin-bottom: 14px;
//         gap: 10px;
//       }

//       .info-icon {
//         width: 28px;
//         height: 28px;
//         font-size: 14px;
//       }

//       .footer {
//         padding: 20px;
//         font-size: 12px;
//       }

//       .footer-links {
//         gap: 10px;
//       }
//     }
//   </style>
// </head>
// <body>
//   <div class="wrapper">
//     <div class="container">
//       <!-- Header -->
//       <div class="header">
//         <!-- Added Hotelire logo -->
//         <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_orignal-ZIsyRe6nmIMtEEZfbMwxH2dMNVHAhy.png" alt="Hotelire Logo" class="header-logo" />
//         <h1>Verify Your Email</h1>
//         <p>Your perfect stay is one click away!</p>
//       </div>


//       <!-- Content -->
//       <div class="content">
//         <h2 class="content-title">Welcome to Hotelire</h2>
//         <p class="content-text">
//           Thank you for making your account activated with <strong>Hotelire</strong>! We're excited to have you on board. Please use the verification code below to confirm your email address.
//         </p>

//         <!-- Code Section -->
//         <div class="code-section">
//           <span class="code-label">Your Verification Code</span>
//           <div class="code-box">${code}</div>
//         </div>

//         <!-- Info Section -->
//         <div class="info-section">
//           <div class="info-item">
//             <div >⏱</div>
//             <div class="info-text">
//               <strong>Code Expires In:</strong>
//               10 minutes
//             </div>
//           </div>
//           <div class="info-item">
//             <div >✓</div>
//             <div class="info-text">
//               <strong>One-time Use:</strong>
//               This code can only be used once
//             </div>
//           </div>
//           <div class="info-item">
//             <div >🔒</div>
//             <div class="info-text">
//               <strong>Secure:</strong>
//               Never share this code with anyone
//             </div>
//           </div>
//         </div>

//         <p class="content-text" style="margin-top: 30px; font-size: 13px; color: #888;">
//           If you didn't create this account, please ignore this email or contact our support team immediately.
//         </p>
//       </div>

//       <!-- Footer -->
//       <div class="footer">
//         <div class="footer-content">
//           <p>© ${new Date().getFullYear()} Hotelire. All rights reserved.</p>
//         </div>
//         <div class="footer-links">
//           <a href="mailto:support@hotelire.com" class="footer-link">📧 Support</a>
//           <span class="footer-divider">•</span>
//           <a href="https://hotelire.com/privacy" class="footer-link">Privacy Policy</a>
//           <span class="footer-divider">•</span>
//           <a href="https://hotelire.com/terms" class="footer-link">Terms of Service</a>
//         </div>
//         <p class="copyright">
//           This is an automated message. Please do not reply to this email.
//         </p>
//       </div>
//     </div>
//   </div>
// </body>
// </html>
//   `;
// }

// export const sendEmail = async (to, code) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.SMTP_EMAIL,
//       pass: process.env.SMTP_PASS,
//     },
//   });
//   const mailOptions = {
//     from: `"Hotelier (Your perfect stay, Is one click away)" <${process.env.SMTP_EMAIL}>`,
//     to,
//     subject: "Your Verification Code",
//     html: verificationEmailTemplate(code),
//   };
//   await transporter.sendMail(mailOptions);
// };


// /utils/sendMail.js
import nodemailer from "nodemailer"

function verificationEmailTemplate(code) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      color: #2c3e50;
      line-height: 1.6;
      padding: 20px;
    }

    .wrapper {
      max-width: 600px;
      margin: 0 auto;
    }

    .container {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(89, 165, 178, 0.12);
      overflow: hidden;
      border: 1px solid rgba(89, 165, 178, 0.1);
    }

/* Header Section */
    .header {
      background: #ffffff;
      color: #2c3e50;
      text-align: center;
      padding: 40px 30px;
      position: relative;
      overflow: hidden;
      border-bottom: 3px solid #59A5B2;
    }

    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(89, 165, 178, 0.08);
      border-radius: 50%;
    }

    /* Added logo styling */
    .header-logo {
      max-width: 180px;
      height: auto;
      margin: 0 auto 20px;
      display: block;
    }

    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
      color: #2c3e50;
    }

    .header p {
      font-size: 14px;
      color: #59A5B2;
      font-weight: 500;
    }


    /* Content Section */
    .content {
      padding: 45px 30px;
      text-align: center;
    }

    .content-title {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .content-text {
      font-size: 15px;
      color: #555;
      margin-bottom: 35px;
      line-height: 1.7;
    }

    .content-text strong {
      color: #59A5B2;
      font-weight: 600;
    }

    /* Code Box */
    .code-section {
      margin: 35px 0;
    }

    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #59A5B2;
      font-weight: 700;
      margin-bottom: 12px;
      display: block;
    }

    .code-box {
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      border: 2px solid #59A5B2;
      color: #59A5B2;
      font-size: 36px;
      letter-spacing: 8px;
      font-weight: 700;
      padding: 25px;
      border-radius: 15px;
      display: inline-block;
      font-family: 'Courier New', monospace;
      box-shadow: 0 4px 15px rgba(89, 165, 178, 0.1);
      transition: all 0.3s ease;
    }

    .code-box:hover {
      box-shadow: 0 8px 25px rgba(89, 165, 178, 0.2);
      transform: translateY(-2px);
    }

    /* Info Section */
    .info-section {
      background: #f8fafb;
      border-left: 4px solid #59A5B2;
      padding: 20px;
      border-radius: 10px;
      margin: 30px 0;
      text-align: left;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      font-size: 14px;
      color: #555;
      gap: 12px;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    /* Improved info-icon styling for proper alignment */
    .info-icon {
      width: 32px;
      height: 32px;
      background: #59A5B2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      flex-shrink: 0;
      font-weight: bold;
      margin-top: 2px;
    }

    .info-text {
      flex: 1;
      padding-top: 2px;
    }

    .info-text strong {
      color: #2c3e50;
      display: block;
      margin-bottom: 3px;
      font-weight: 600;
    }

    /* Footer Section */
    .footer {
      background: #f8fafb;
      color: #666;
      text-align: center;
      font-size: 13px;
      padding: 30px;
      border-top: 1px solid #e8e8e8;
    }

    .footer-content {
      margin-bottom: 15px;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 15px;
    }

    .footer-link {
      color: #59A5B2;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .footer-link:hover {
      color: #4a8a99;
      text-decoration: underline;
    }

    .footer-divider {
      color: #ddd;
      margin: 0 5px;
    }

    .copyright {
      color: #999;
      font-size: 12px;
      margin-top: 15px;
    }

    /* Mobile Responsive */
    @media (max-width: 600px) {
      body {
        padding: 15px;
      }

      .container {
        border-radius: 16px;
      }

      .header {
        padding: 30px 20px;
      }

      /* Mobile logo sizing */
      .header-logo {
        max-width: 150px;
        margin: 0 auto 15px;
      }

      .header h1 {
        font-size: 24px;
      }

      .content {
        padding: 30px 20px;
      }

      .content-title {
        font-size: 18px;
      }

      .content-text {
        font-size: 14px;
      }

      .code-box {
        font-size: 28px;
        letter-spacing: 6px;
        padding: 20px;
      }

      .info-section {
        padding: 15px;
      }

      .info-item {
        margin-bottom: 14px;
        gap: 10px;
      }

      .info-icon {
        width: 28px;
        height: 28px;
        font-size: 14px;
      }

      .footer {
        padding: 20px;
        font-size: 12px;
      }

      .footer-links {
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
 <a href="https://hotelire.com">
          <img src="https://res.cloudinary.com/dzzuoem1w/image/upload/v1767352509/logo_orignal_q0jn75.png" alt="Hotelire Logo" class="header-logo" />
        </a>         <h1>Verify Your Email</h1>
        <p>Your perfect stay is one click away!</p>
      </div>

     
      <!-- Content -->
      <div class="content">
        <h2 class="content-title">Welcome to Hotelire</h2>
        <p class="content-text">
          Thank you for making your account activated with <strong>Hotelire</strong>! We're excited to have you on board. Please use the verification code below to confirm your email address.
        </p>

        <!-- Code Section -->
        <div class="code-section">
          <span class="code-label">Your Verification Code</span>
          <div class="code-box">${code}</div>
        </div>

        <!-- Info Section -->
        <div class="info-section">
          <div class="info-item">
            <div >⏱</div>
            <div class="info-text">
              <strong>Code Expires In:</strong>
              10 minutes
            </div>
          </div>
          <div class="info-item">
            <div >✓</div>
            <div class="info-text">
              <strong>One-time Use:</strong>
              This code can only be used once
            </div>
          </div>
          <div class="info-item">
            <div >🔒</div>
            <div class="info-text">
              <strong>Secure:</strong>
              Never share this code with anyone
            </div>
          </div>
        </div>

        <p class="content-text" style="margin-top: 30px; font-size: 13px; color: #888;">
          If you didn't create this account, please ignore this email or contact our support team immediately.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-content">
          <p>© ${new Date().getFullYear()} Hotelire. All rights reserved.</p>
        </div>
        <div class="footer-links">
          <a href="mailto:support@hotelire.com" class="footer-link">📧 Support</a>
          <span class="footer-divider">•</span>
          <a href="https://hotelire.com/privacy" class="footer-link">Privacy Policy</a>
          <span class="footer-divider">•</span>
          <a href="https://hotelire.com/terms" class="footer-link">Terms of Service</a>
        </div>
        <p class="copyright">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export const sendEmail = async (to, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  })
  const mailOptions = {
    from: `"Hotelier (Your perfect stay, Is one click away)" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Your Verification Code",
    html: verificationEmailTemplate(code),
  }
  await transporter.sendMail(mailOptions)
}
