

import express from "express";
import { getOwnerBookings,getBookingDetailsForOwner,confirmBooking,cancelBooking,getOwnerBookingStats} from "../Controller/ownerBookingController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";


const router = express.Router();



// Get all bookings for owner's properties
router.get("/:ownerId", getOwnerBookings)

// Get single booking details
router.get("/:ownerId/:bookingId", getBookingDetailsForOwner)

// Confirm/Accept booking
router.put("/:ownerId/:bookingId/confirm", confirmBooking)

// Cancel/Reject booking with optional refund
router.put("/:ownerId/:bookingId/cancel", cancelBooking)

// Get booking statistics
router.get("/stats/:ownerId", getOwnerBookingStats)

export default router
