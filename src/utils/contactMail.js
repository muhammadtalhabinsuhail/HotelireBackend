// import nodemailer from "nodemailer";

// export const sendContactMail = async (req, res) => {
//   try {
//     const { firstName, lastName, email, message } = req.body;

//     /* ---------------- VALIDATION ---------------- */
//     if (!firstName || !lastName) {
//       return res.status(400).json({
//         message: "First name and last name are required",
//       });
//     }

//     if (!email) {
//       return res.status(400).json({
//         message: "Email address is required",
//       });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         message: "Invalid email address",
//       });
//     }

//     if (!message || message.length < 10) {
//       return res.status(400).json({
//         message: "Message must be at least 10 characters long",
//       });
//     }

//     /* ---------------- MAIL TRANSPORT ---------------- */
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.SMTP_EMAIL,
//           pass: process.env.SMTP_PASS,
//         },
//       })
    

//     /* ---------------- SEND MAIL ---------------- */
//     await transporter.sendMail({
//       from: `Hotelire Contact ${email}`,
//       to: process.env.SMTP_EMAIL,
//       replyTo: email,
//       subject: "Hotelire Alert! New Contact Us Message",
//       html: `
//         <div style="font-family: Arial, sans-serif; line-height: 1.6;">
//                <a href="https://hotelire.com">
//           <img src="https://res.cloudinary.com/dzzuoem1w/image/upload/v1767352509/logo_orignal_q0jn75.png" alt="Hotelire Logo" class="header-logo" />
//         </a>      

//          <center> <h2 style="color:#59A5B2;">New Contact Message</h2> </center>
//           <p><strong>Name:</strong> ${firstName} ${lastName}</p>
//           <p><strong>Email:</strong> ${email}</p>
//           <p><strong>Message:</strong></p>
//           <p>${message}</p>
//           <hr />
//           <p style="font-size:12px;color:#777;">
//             This message was sent via Hotelire Contact Page.
//           </p>
//         </div>
//       `,
//     });

//     return res.status(200).json({
//       message: "Message sent successfully",
//     });
//   } catch (error) {
//     console.error("Contact form error:", error);

//     return res.status(500).json({
//       message: "Unable to send message at the moment",
//     });
//   }
// };

import axios from "axios";
import FormData from "form-data";

export const sendContactMail = async (req, res) => {
  try {
    const { firstName, lastName, email, message } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!firstName || !lastName) {
      return res.status(400).json({
        message: "First name and last name are required",
      });
    }

    if (!email) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    if (!message || message.length < 10) {
      return res.status(400).json({
        message: "Message must be at least 10 characters long",
      });
    }

    /* ---------------- MAILGUN FORM ---------------- */
    const form = new FormData();
form.append("from", process.env.MAIL_FROM);
    form.append("to", process.env.SMTP_EMAIL); // Where you want to receive contact messages
    form.append("subject", "Hotelire Alert! New Contact Us Message");
    form.append(
      "html",
      ` 
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <a href="https://hotelire.com">
          <img src="https://res.cloudinary.com/dzzuoem1w/image/upload/v1767352509/logo_orignal_q0jn75.png" alt="Hotelire Logo" class="header-logo" />
        </a>      

        <center><h2 style="color:#59A5B2;">New Contact Message</h2></center>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr />
        <p style="font-size:12px;color:#777;">
          This message was sent via Hotelire Contact Page.
        </p>
      </div>
      `
    );
    form.append("h:Reply-To", email); // reply directly to user

    /* ---------------- SEND MAIL ---------------- */
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
    );

    return res.status(200).json({
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("MAILGUN Contact form error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Unable to send message at the moment",
    });
  }
};
