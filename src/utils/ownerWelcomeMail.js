// utils/emailTemplates/welcomeHostEmail.js
// utils/sendMail.js

import axios from "axios";
import FormData from "form-data";


function welcomeHostEmailTemplate({ firstName, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Hotelire</title>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      color: #ffffffff;
      padding: 20px;
      line-height: 1.6;
    }

    .wrapper { max-width: 600px; margin: 0 auto; }

    .container {
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(89, 165, 178, 0.12);
      border: 1px solid rgba(89, 165, 178, 0.1);
    }

    .header {
      text-align: center;
      padding: 40px 30px;
      border-bottom: 3px solid #59A5B2;
    }

    .header-logo {
      max-width: 160px;
      margin-bottom: 20px;
    }

    .header-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .header-subtitle {
      font-size: 14px;
      color: #59A5B2;
      font-weight: 500;
    }

    .content {
      padding: 40px 30px;
    }

    .greeting {
      font-size: 15px;
      color: #555;
      margin-bottom: 20px;
    }

    .greeting-name {
      color: #59A5B2;
      font-weight: 600;
    }

    a {
  color: #ffffffff !important; /* Inherits color from parent */
  text-decoration: none !important; /* Removes underline */
  /* Add other resets like font-weight, etc. */
}
/* For visited, hover, etc. */
a:visited, a:hover, a:active {
  color: inherit;
  text-decoration: none !important;
}


    .text {
      font-size: 15px;
      color: #555;
      margin-bottom: 25px;
      line-height: 1.7;
    }

    .checklist-title {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #59A5B2;
      font-weight: 700;
      margin-bottom: 18px;
    }

    .checklist-item {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #555;
    }

    .icon  {
      width: 24px;
      height: 24px;

      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      flex-shrink: 0;
      font-weight: 600;
      margin-top: 2px;
    }

    .cta {
      text-align: center;
      margin: 35px 0;
    }

    .cta-btn {
      background: #59A5B2;
      color: #ffffffff;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
    }

    .cta-btn:hover {
      background: #4a8a99;
    }

    .closing {
      border-top: 1px solid #e8e8e8;
      padding-top: 25px;
      margin-top: 30px;
    }

    .footer-bar {
      background: #FDB913;
      height: 12px;
    }

    @media (max-width: 600px) {
      .content { padding: 30px 20px; }
      .header { padding: 30px 20px; }
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo_orignal-ZIsyRe6nmIMtEEZfbMwxH2dMNVHAhy.png"
          alt="Hotelire Logo"
          class="header-logo"
        />
        <h1 class="header-title">Welcome to Hotelire</h1>
        <p class="header-subtitle">Start earning by hosting today</p>
      </div>

      <div class="content">
        <p class="greeting">
          Hello <span class="greeting-name">${firstName || "Host"}</span>,
        </p>

        <p class="text">
          Welcome to <strong>Hotelire</strong>! Your host account has been successfully created.
        </p>

        <p class="text">
          You're now one step away from listing your property and welcoming guests from around the world.
        </p>

        <div class="checklist-title">Getting Started</div>

        <div class="checklist-item">
          <div class="icon">📸</div>
          <div>List your property with photos, amenities, and pricing.</div>
        </div>

        <div class="checklist-item">
          <div class="icon">💳</div>
          <div>Set up Stripe payouts to receive payments securely.</div>
        </div>

        <div class="checklist-item">
          <div class="icon">
          <span style="color:#59A5B2;font-weight:700;">✓</span>
</div>
          <div>Verify your ownership documents.</div>
        </div>

        <div class="checklist-item">
          <div class="icon">📊</div>
          <div>Manage bookings from your dashboard.</div>
        </div>

        <div class="cta">
          <a href="${dashboardUrl}" class="cta-btn">Complete My Profile</a>
        </div>

        <div class="closing">
          <p class="text">Thanks for choosing Hotelire,</p>
          <p><strong>The Hotelire Team</strong></p>
          <p style="font-size:13px;color:#888;margin-top:10px;">
            Need help? Email us at
            <a href="mailto:info@hotelire.ca">info@hotelire.ca</a>
          </p>
        </div>
      </div>

      <div class="footer-bar"></div>

    </div>
  </div>
</body>
</html>
`;
}


export const sendWelcomeHostEmail = async ({to, firstName}) => {
  const form = new FormData()

  form.append("from", process.env.MAIL_FROM) // Hotelire <no-reply@mg.hotelire.ca>
  form.append("to", to)
  form.append("subject", "Welcome to Hotelire – Start Hosting Today")
  form.append("html", welcomeHostEmailTemplate({ firstName, dashboardUrl: `${process.env.FRONTEND_URL}/owner/verification` }))

  try {
    await axios.post(
      `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
      form,
      {
        auth: {
          username: "api",
          password: process.env.MAILGUN_API_KEY,
        },
        headers: form.getHeaders(),
        timeout: 10000,
      }
    )
  } catch (error) {
    console.error(
      "MAILGUN ERROR:",
      error.response?.data || error.message
    )
    throw new Error("Email sending failed")
  }
}