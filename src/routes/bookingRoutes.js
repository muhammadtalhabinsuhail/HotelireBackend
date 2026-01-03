import express from "express";
import { createBooking,getBookingDetails,getUserBookings,cancelBooking,completeExpiredBookings} from "../Controller/bookingController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";


const router = express.Router();






// Called from BookingSummaryPage after successful payment
router.post("/create", createBooking)

// Called from BookingConfirmationPage using bookingId from URL params
router.get("/details/:bookingId", getBookingDetails)

// Cancels booking and deletes room availability records
router.put("/cancel/:bookingId", cancelBooking)

// Should be called daily to check for bookings with checkout date <= today
router.post("/cron/complete-expired", completeExpiredBookings)


router.get("/my-bookings", verifyAuthentication, getUserBookings)


export default router;
