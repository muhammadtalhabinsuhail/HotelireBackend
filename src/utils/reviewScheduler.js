import prisma from "../config/prisma.js";
import { sendEmail } from "./sendEmail.js";
import { getReviewEmailTemplate } from "./reviewEmailTemplate.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const FRONTEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

/**
 * Generate JWT token for review (24h expiry)
 */
const generateReviewToken = (userId, bookingId, propertyId) => {
  return jwt.sign(
    { userId, bookingId, propertyId },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

/**
 * Automatically send review emails for completed bookings
 * Call this function every hour or after each booking completion
 * 
 * Purpose of sendEmail from ./sendMail.js:
 * - sendMail.js is your existing email utility that connects to your email provider
 * - It handles the actual sending of emails to customers
 * - We use it to send professional review request emails with JWT tokens
 */
export const sendReviewEmailsForCompletedBookings = async () => {
  try {
    const now = new Date();
    console.log("[Review Scheduler] Starting review email check...");

    // Find all completed bookings where:
    // 1. Checkout date has passed
    // 2. Review email hasn't been sent yet (review_requested = false)
    const completedBookings = await prisma.booking.findMany({
      where: {
        booking_status: "COMPLETED",
        checkout_date: {
          lt: now,
        },
      },
      include: {
        User: true,
        property: true,
      },
    });

    console.log(`[Review Scheduler] Found ${completedBookings.length} completed bookings`);

    let emailsSent = 0;
    const errors = [];

    for (const booking of completedBookings) {
      try {
        // Get or create review record using correct field name
        let review = await prisma.review.findFirst({
          where: { 
            booking: {
              bookingid: booking.bookingid
            }
          },
        });

        if (!review) {
          review = await prisma.review.create({
            data: {
              booking: {
                connect: { bookingid: booking.bookingid }
              },
              property: {
                connect: { propertyid: booking.propertyid }
              },
              User: {
                connect: { userid: booking.userid }
              },
              rating: null,  // Rating will be filled when user submits review
              review_requested: false,
              review_submitted: false,
            },
          });
          console.log(`[Review Scheduler] Created review record for booking ${booking.bookingid}`);
        }

        // Skip if review already requested or submitted
        if (review.review_requested) {
          console.log(
            `[Review Scheduler] Skipping booking ${booking.bookingid} - email already sent`
          );
          continue;
        }

        if (review.review_submitted) {
          console.log(
            `[Review Scheduler] Skipping booking ${booking.bookingid} - review already submitted`
          );
          continue;
        }

        // Generate review token
        const reviewToken = generateReviewToken(
          booking.userid,
          booking.bookingid,
          booking.propertyid
        );

        // Create review URL
        const reviewUrl = `${FRONTEND_URL}/customer/review?token=${reviewToken}`;

        // Send email using your existing sendEmail utility
        const emailContent = getReviewEmailTemplate(
          `${booking.User.firstname} ${booking.User.lastname}`,
          booking.property.propertytitle,
          reviewToken,
          reviewUrl
        );

        await sendEmail(
          booking.User.email,
          "Share Your Hotelire Experience",
          emailContent
        );

        // Mark review_requested as true to prevent duplicate emails
        await prisma.review.update({
          where: { id: review.id },
          data: { review_requested: true },
        });

        console.log(
          `[Review Scheduler] ✅ Email sent for booking ${booking.bookingid} to ${booking.User.email}`
        );
        emailsSent++;
      } catch (error) {
        console.error(
          `[Review Scheduler] ❌ Error sending email for booking ${booking.bookingid}:`,
          error.message
        );
        errors.push({
          bookingId: booking.bookingid,
          error: error.message,
        });
      }
    }

    console.log(`[Review Scheduler] Complete: ${emailsSent} emails sent, ${errors.length} errors`);
    
    return {
      success: true,
      emailsSent,
      totalBookings: completedBookings.length,
      errors: errors.length > 0 ? errors : [],
    };
  } catch (error) {
    console.error("[Review Scheduler] Fatal error:", error.message);
    throw error;
  }
};

/**
 * Setup interval-based review email sending
 * Run every hour to check for completed bookings
 */
export const initializeReviewScheduler = () => {
  // Run immediately on startup
  console.log("[Review Scheduler] Initializing on startup...");
  sendReviewEmailsForCompletedBookings().catch(err => 
    console.error("[Review Scheduler] Startup error:", err)
  );

  // Run every hour (3600000 ms)
  setInterval(() => {
    console.log("[Review Scheduler] Running scheduled check...");
    sendReviewEmailsForCompletedBookings().catch(err => 
      console.error("[Review Scheduler] Scheduled check error:", err)
    );
  }, 3600000); // 1 hour

  console.log("[Review Scheduler] ✅ Initialized - will check every hour");
};

export default { sendReviewEmailsForCompletedBookings, initializeReviewScheduler };
