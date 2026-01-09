// import nodemailer from "nodemailer"

// export const sendEmail = async (to, subject, html) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.SMTP_EMAIL,
//       pass: process.env.SMTP_PASS,
//     },
//   })

//   const mailOptions = {
//     from: `"Hotelire" <${process.env.SMTP_EMAIL}>`,
//     to,
//     subject,
//     html,
//   }

//   await transporter.sendMail(mailOptions)
// }


import axios from "axios";
import FormData from "form-data";

export const sendEmail = async (to, subject,html) => {
  const form = new FormData();

  form.append("from", process.env.MAIL_FROM); // e.g., Hotelire <no-reply@mg.hotelire.ca>
  form.append("to", to);
  form.append("subject", subject);
  form.append("html", html);

  try {
    const response = await axios.post(
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

    console.log("Mailgun response:", response.data);
  } catch (error) {
    console.error(
      "MAILGUN ERROR:",
      error.response?.data || error.message
    );
    throw new Error("Email sending failed");
  }
};
