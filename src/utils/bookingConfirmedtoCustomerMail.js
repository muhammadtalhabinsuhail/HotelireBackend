export function customerBookingConfirmedEmailTemplate(
  customerName ,
  propertyName = "Property Name",
  bookingId = "HB-XXXX",
  checkIn = "N/A",
  checkOut = "N/A",
  guests = "N/A",
  bookingUrl = "https://hotelire.com/bookings"
) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed</title>
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
      margin-bottom: 25px;
      line-height: 1.7;
    }

    .content-text strong {
      color: #59A5B2;
      font-weight: 600;
    }

    /* Booking Box */
    .booking-box {
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      border: 2px solid #59A5B2;
      border-radius: 16px;
      padding: 25px;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(89, 165, 178, 0.1);
      text-align: left;
    }

    .booking-title {
      font-size: 18px;
      font-weight: 700;
      color: #59A5B2;
      margin-bottom: 10px;
      text-align: center;
    }

    .booking-text {
      font-size: 14px;
      color: #444;
      line-height: 1.8;
    }

    /* CTA Button */
    .cta-button {
      display: inline-block;
      margin: 30px auto 10px;
      background: #59A5B2;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 6px 18px rgba(89, 165, 178, 0.3);
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      background: #4a8a99;
      box-shadow: 0 8px 24px rgba(89, 165, 178, 0.4);
      transform: translateY(-1px);
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
        </a>        <h1>Booking Confirmed 🎉</h1>
        <p>Your stay is successfully booked</p>
      </div>

      <!-- Content -->
      <div class="content">
        <h2 class="content-title">Hello ${customerName},</h2>

        <p class="content-text">
          We’re happy to inform you that your booking at
          <strong>${propertyName}</strong> has been successfully confirmed.
          Below are your booking details.
        </p>

        <div class="booking-box">
          <div class="booking-title">Booking Details</div>
          <p class="booking-text">
            <strong>Booking ID:</strong> ${bookingId}<br />
            <strong>Check-in:</strong> ${checkIn}<br />
            <strong>Check-out:</strong> ${checkOut}<br />
            <strong>Guests:</strong> ${guests}
          </p>
        </div>

        <a href="${bookingUrl}" class="cta-button">
          View Booking Details
        </a>

        <div class="info-section">
          <div class="info-item">
            <div >📍</div>
            <div class="info-text">
              <strong>Property Location</strong>
              Full address and directions are available on your booking page
            </div>
          </div>

          <div class="info-item">
            <div >🛎️</div>
            <div class="info-text">
              <strong>Need Help?</strong>
              You can contact the host or support anytime
            </div>
          </div>

          <div class="info-item">
            <div>📄</div>
            <div class="info-text">
              <strong>Booking Management</strong>
              View, manage, or cancel your booking from your dashboard
            </div>
          </div>
        </div>

        <p class="content-text" style="font-size: 14px; color: #666;">
          We wish you a comfortable and pleasant stay.
          Thank you for choosing <strong>Hotelire</strong>.
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