import express from "express";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import {
  sendReviewEmail,
  sendReviewEmailsForCompletedBookings,
  getReviewPageData,
  submitReview,
  getPropertyReviews,
  getOwnerReviews
} from "../Controller/reviewController.js";

const router = express.Router();

// Send review email after booking completion (authenticated)
router.post("/send-email", verifyAuthentication, sendReviewEmail);

// Automatically send review emails for completed bookings (scheduled job)
// This should be called by a scheduled task (cron job) or webhook
router.post("/send-completed-bookings", sendReviewEmailsForCompletedBookings);

// Get review page data (with token, no auth needed)
router.get("/page-data", getReviewPageData);

// Submit review (with token, no auth needed)
router.post("/submit", submitReview);



router.get("/property/:propertyId", getPropertyReviews);

router.get("/owner", verifyAuthentication, getOwnerReviews);


export default router;
