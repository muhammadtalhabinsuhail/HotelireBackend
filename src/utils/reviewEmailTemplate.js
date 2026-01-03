// const getReviewEmailTemplate = (
//   guestName,
//   propertyName,
//   reviewToken,
//   reviewUrl
// ) => {
//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
//           .header { background: #59A5B2; color: white; padding: 20px; border-radius: 5px; text-align: center; }
//           .content { background: white; padding: 30px; border-radius: 5px; margin-top: 20px; }
//           .cta-button {
//             display: inline-block;
//             background: #59A5B2;
//             color: white;
//             padding: 12px 30px;
//             text-decoration: none;
//             border-radius: 5px;
//             margin: 20px 0;
//             font-weight: bold;
//           }
//           .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
//           .warning { color: #ff6b6b; font-size: 12px; margin-top: 10px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Share Your Experience with Hotelire</h1>
//           </div>

//           <div class="content">
//             <p>Hi ${guestName},</p>

//             <p>Thank you for choosing <strong>${propertyName}</strong> for your stay! We'd love to hear about your experience.</p>

//             <p>Your feedback helps other travelers make informed decisions and helps property owners improve their services.</p>

//             <p style="text-align: center;">
//               <a href="${reviewUrl}" class="cta-button">Leave Your Review</a>
//             </p>

//             <p><strong>Review Link Details:</strong></p>
//             <ul>
//               <li>✓ This link is unique to you</li>
//               <li>✓ It expires in 24 hours</li>
//               <li>✓ You can submit your review in under 2 minutes</li>
//             </ul>

//             <p>If the button doesn't work, copy and paste this link into your browser:</p>
//             <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
//               ${reviewUrl}
//             </p>

//             <div class="warning">
//               <strong>⏰ Important:</strong> This review link expires in 24 hours. Share your feedback while your experience is fresh!
//             </div>

//             <p>Best regards,<br><strong>The Hotelire Team</strong></p>
//           </div>

//           <div class="footer">
//             <p>© 2025 Hotelire. All rights reserved.</p>
//             <p>This is an automated email. Please do not reply directly.</p>
//           </div>
//         </div>
//       </body>
//     </html>
//   `;
// };

// export { getReviewEmailTemplate };



// const getReviewEmailTemplate = (guestName, propertyName, reviewToken, reviewUrl) => {
//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//           .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
//           .header { background: #59A5B2; color: white; padding: 20px; border-radius: 5px; text-align: center; }
//           .content { background: white; padding: 30px; border-radius: 5px; margin-top: 20px; }
//           .cta-button {
//             display: inline-block;
//             background: #59A5B2;
//             color: white;
//             padding: 12px 30px;
//             text-decoration: none;
//             border-radius: 5px;
//             margin: 20px 0;
//             font-weight: bold;
//           }

//               a {
//   color: #ffffffff !important; /* Inherits color from parent */
//   text-decoration: none !important; /* Removes underline */
//   /* Add other resets like font-weight, etc. */
// }
// /* For visited, hover, etc. */
// a:visited, a:hover, a:active {
//   color: inherit;
//   text-decoration: none !important;
// }



//           .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
//           .warning { color: #ff6b6b; font-size: 12px; margin-top: 10px; }
//         </style>
//       </head>
//       <body>
//         <div class="container">
//           <div class="header">
//             <h1>Share Your Experience with Hotelire</h1>
//           </div>
          
//           <div class="content">
//             <p>Hi ${guestName},</p>
            
//             <p>Thank you for choosing <strong>${propertyName}</strong> for your stay! We'd love to hear about your experience.</p>
            
//             <p>Your feedback helps other travelers make informed decisions and helps property owners improve their services.</p>
            
//             <p style="text-align: center;">
//               <a href="${reviewUrl}" class="cta-button">Leave Your Review</a>
//             </p>
            
//             <p><strong>Review Link Details:</strong></p>
//             <ul>
//               <li>✓ This link is unique to you</li>
//               <li>✓ It expires in 24 hours</li>
//               <li>✓ You can submit your review in under 2 minutes</li>
//             </ul>
            
         
//             <div class="warning">
//               <strong>⏰ Important:</strong> This review link expires in 24 hours. Share your feedback while your experience is fresh!
//             </div>
            
//             <p>Best regards,<br><strong>The Hotelire Team</strong></p>
//           </div>
          
//           <div class="footer">
//             <p>© 2025 Hotelire. All rights reserved.</p>
//             <p>This is an automated email. Please do not reply directly.</p>
//           </div>
//         </div>
//       </body>
//     </html>
//   `
// }



const getReviewEmailTemplate = (guestName, propertyName, reviewToken, reviewUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Share Your Experience</title>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #f0f9fb 0%, #e8f4f8 100%);
      padding: 20px;
      line-height: 1.6;
      color: #555;
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
      color: #333;
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
      margin-bottom: 20px;
    }

    .greeting-name {
      color: #59A5B2;
      font-weight: 600;
    }

    .text {
      font-size: 15px;
      margin-bottom: 22px;
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
      margin-bottom: 14px;
      font-size: 14px;
    }

    .icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #59A5B2;
      flex-shrink: 0;
    }

    .cta {
      text-align: center;
      margin: 35px 0;
    }

    .cta-btn {
      background: #59A5B2;
      color: #ffffff !important;
      padding: 14px 34px;
      border-radius: 8px;
      text-decoration: none !important;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
    }

    .cta-btn:hover {
      background: #4a8a99;
    }

    .warning {
      font-size: 13px;
      color: #ff6b6b;
      margin-top: 10px;
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

    a {
      color: inherit;
      text-decoration: none !important;
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
        <h1 class="header-title">Share Your Experience</h1>
        <p class="header-subtitle">Your feedback helps other travelers</p>
      </div>

      <div class="content">
        <p class="greeting">
          Hello <span class="greeting-name">${guestName || "Guest"}</span>,
        </p>

        <p class="text">
          Thank you for staying at <strong>${propertyName}</strong>.
          We’d love to hear how your experience was.
        </p>

        <p class="text">
          Your review helps future guests make confident decisions and allows hosts to improve their service.
        </p>

        <div class="checklist-title">Why Leave a Review?</div>

        <div class="checklist-item">
          <div class="icon">✓</div>
          <div>Help other travelers choose better stays</div>
        </div>

        <div class="checklist-item">
          <div class="icon">✓</div>
          <div>Support hosts with honest feedback</div>
        </div>

        <div class="checklist-item">
          <div class="icon">✓</div>
          <div>It takes less than 2 minutes</div>
        </div>

        <div class="cta">
          <a href="${reviewUrl}" class="cta-btn">Leave My Review</a>
        </div>

        <p class="warning">
          ⏰ This review link is unique and expires in 24 hours.
        </p>

        <div class="closing">
          <p class="text">Thank you for choosing Hotelire,</p>
          <p><strong>The Hotelire Team</strong></p>
        </div>
      </div>

      <div class="footer-bar"></div>

    </div>
  </div>
</body>
</html>
`
}



export { getReviewEmailTemplate }
