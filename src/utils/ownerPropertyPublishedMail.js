function propertyPublishedEmailTemplate(ownerName = "Partner", propertyName = "Your Property") {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Property Published</title>
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

    /* Header */
    .header {
      background: #ffffff;
      text-align: center;
      padding: 40px 30px;
      border-bottom: 3px solid #59A5B2;
      position: relative;
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

    .header-logo {
      max-width: 180px;
      margin: 0 auto 20px;
      display: block;
    }

    .header h1 {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #2c3e50;
    }

    .header p {
      font-size: 14px;
      color: #59A5B2;
      font-weight: 500;
    }

    /* Content */
    .content {
      padding: 45px 30px;
      text-align: center;
    }

    .content-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .content-text {
      font-size: 15px;
      color: #555;
      margin-bottom: 30px;
      line-height: 1.7;
    }

    .content-text strong {
      color: #59A5B2;
      font-weight: 600;
    }

    /* Success Box */
    .success-box {
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      border: 2px solid #59A5B2;
      border-radius: 16px;
      padding: 25px;
      margin: 35px 0;
      box-shadow: 0 4px 15px rgba(89, 165, 178, 0.1);
    }

    .success-title {
      font-size: 18px;
      font-weight: 700;
      color: #59A5B2;
      margin-bottom: 10px;
    }

    .success-text {
      font-size: 14px;
      color: #444;
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
      gap: 12px;
      margin-bottom: 15px;
      font-size: 14px;
      color: #555;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .info-icon {
      width: 32px;
      height: 32px;
      background: #59A5B2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      flex-shrink: 0;
    }

    .info-text strong {
      display: block;
      color: #2c3e50;
      margin-bottom: 3px;
    }

    /* Footer */
    .footer {
      background: #f8fafb;
      text-align: center;
      padding: 30px;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e8e8e8;
    }

    .footer-links {
      margin-top: 15px;
    }

    .footer-links a {
      color: #59A5B2;
      text-decoration: none;
      margin: 0 8px;
      font-weight: 500;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }

      .header {
        padding: 30px 20px;
      }

      .header-logo {
        max-width: 150px;
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
        </a>        <h1>Property Published Successfully 🎉</h1>
        <p>Your listing is now live on Hotelire</p>
      </div>

      <!-- Content -->
      <div class="content">
        <h2 class="content-title">Well done, ${ownerName}!</h2>

        <p class="content-text">
          Congratulations! Your property <strong>${propertyName}</strong> has been successfully published on
          <strong>Hotelire</strong>. We truly appreciate the effort and care you put into creating your listing.
        </p>

        <div class="success-box">
          <div class="success-title">Your Property Is Now Live</div>
          <p class="success-text">
            Customers can now view, explore, and book your property in real time.
            You are officially open for business on Hotelire.
          </p>
        </div>

        <div class="info-section">
          <div class="info-item">
            <div>👀</div>
            <div class="info-text">
              <strong>Visible to Customers</strong>
              Your property appears in search results instantly
            </div>
          </div>

          <div class="info-item">
            <div>📅</div>
            <div class="info-text">
              <strong>Ready for Bookings</strong>
              Guests can now place booking requests
            </div>
          </div>

          <div class="info-item">
            <div>💰</div>
            <div class="info-text">
              <strong>Start Earning</strong>
              Turn your property into a reliable income source
            </div>
          </div>
        </div>

        <p class="content-text" style="font-size: 14px; color: #666;">
          You’ve taken a great step forward.
          Keep your availability and details updated to maximize bookings.
          We’re excited to see your success on Hotelire.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© Hotelire. All rights reserved.</p>
        <div class="footer-links">
          <a href="mailto:support@hotelire.com">Support</a> •
          <a href="https://hotelire.com/privacy">Privacy Policy</a> •
          <a href="https://hotelire.com/terms">Terms of Service</a>
        </div>
        <p style="margin-top: 10px; font-size: 12px; color: #999;">
          This is an automated message. Please do not reply.
        </p>
      </div>

    </div>
  </div>
</body>
</html>
  `
}