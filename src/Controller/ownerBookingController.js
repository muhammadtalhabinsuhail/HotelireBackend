import prisma from "../config/prisma.js";


import dotenv from "dotenv";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY || "" ;


// Get all bookings for owner's properties
const getOwnerBookings = async (req, res) => {
  try {
    const { ownerId } = req.params

    if (!ownerId) {
      return res.status(400).json({ error: "Owner ID is required" })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          userid: Number.parseInt(ownerId),
        },
      },
      include: {
        property: {
          select: {
            propertyid: true,
            propertytitle: true,
          },
        },
        User: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true,
            phoneno: true,
          },
        },
        booking_room: {
          include: {
            propertyroom: {
              select: {
                roomname: true,
              },
            },
          },
        },
        payment: {
          select: {
            paymentid: true,
            amount: true,
            payment_status: true,
            stripe_payment_intent_id: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // Format response
    const formattedBookings = bookings.map((booking) => ({
      id: booking.bookingid,
      guestName: `${booking.User.firstname} ${booking.User.lastname}`,
      guestEmail: booking.User.email,
      guestPhone: booking.User.phoneno,
      property: booking.property.propertytitle,
      propertyId: booking.property.propertyid,
      room: booking.booking_room.map((br) => br.propertyroom.roomname).join(", "),
      roomCount: booking.booking_room.length,
      checkIn: booking.checkin_date.toISOString().split("T")[0],
      checkOut: booking.checkout_date.toISOString().split("T")[0],
      guests: booking.total_guests,
      adults: booking.adults,
      children: booking.children,
      amount: Number.parseFloat(booking.total_amount),
      nights: booking.total_nights,
      status: booking.booking_status,
      paymentStatus: booking.payment[0]?.payment_status || "UNKNOWN",
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      bookingId: booking.bookingid,
      userId: booking.userid,
      paymentId: booking.payment[0]?.paymentid,
      stripePaymentIntentId: booking.payment[0]?.stripe_payment_intent_id,
    }))

    res.json({
      success: true,
      data: formattedBookings,
    })
  } catch (error) {
    console.error("[v0] Error fetching owner bookings:", error)
    res.status(500).json({ error: "Failed to fetch bookings" })
  }
}

// Get single booking details
const getBookingDetailsForOwner = async (req, res) => {
  try {
    const { bookingId, ownerId } = req.params

    if (!bookingId || !ownerId) {
      return res.status(400).json({ error: "Booking ID and Owner ID are required" })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingid: Number.parseInt(bookingId),
        property: {
          userid: Number.parseInt(ownerId),
        },
      },
      include: {
        property: true,
        User: true,
        booking_room: {
          include: {
            propertyroom: true,
          },
        },
        payment: {
          include: {
            payment_method: true,
          },
        },
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    res.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error("[v0] Error fetching booking details:", error)
    res.status(500).json({ error: "Failed to fetch booking details" })
  }
}

// Confirm/Accept booking (change status from PENDING to CONFIRMED)
const confirmBooking = async (req, res) => {
  try {
    const { bookingId, ownerId } = req.params

    if (!bookingId || !ownerId) {
      return res.status(400).json({ error: "Booking ID and Owner ID are required" })
    }

    // Verify booking belongs to owner
    const booking = await prisma.booking.findFirst({
      where: {
        bookingid: Number.parseInt(bookingId),
        property: {
          userid: Number.parseInt(ownerId),
        },
      },
      include: {
        property: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    if (booking.booking_status !== "PENDING") {
      return res.status(400).json({ error: `Cannot confirm booking with status: ${booking.booking_status}` })
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { bookingid: Number.parseInt(bookingId) },
      data: { booking_status: "CONFIRMED" },
      include: {
        User: true,
        property: true,
        payment: true,
      },
    })

    res.json({
      success: true,
      message: "Booking confirmed successfully",
      data: updatedBooking,
    })
  } catch (error) {
    console.error("[v0] Error confirming booking:", error)
    res.status(500).json({ error: "Failed to confirm booking" })
  }
}

// Cancel/Reject booking (change status to CANCELLED and refund if PAID)
const cancelBooking = async (req, res) => {
  try {
    const { bookingId, ownerId } = req.params
    const { reason } = req.body

    if (!bookingId || !ownerId) {
      return res.status(400).json({ error: "Booking ID and Owner ID are required" })
    }

    // Verify booking belongs to owner
    const booking = await prisma.booking.findFirst({
      where: {
        bookingid: Number.parseInt(bookingId),
        property: {
          userid: Number.parseInt(ownerId),
        },
      },
      include: {
        payment: true,
        room_availability: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" })
    }

    if (booking.booking_status === "COMPLETED" || booking.booking_status === "CANCELLED") {
      return res.status(400).json({ error: `Cannot cancel booking with status: ${booking.booking_status}` })
    }

    let refundStatus = null

    // If payment was made, process refund
    if (booking.payment[0]?.payment_status === "PAID" && booking.payment[0]?.stripe_payment_intent_id) {
      try {
        // Refund via Stripe
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment[0].stripe_payment_intent_id,
        })

        // Update payment status to REFUNDED
        await prisma.payment.update({
          where: { paymentid: booking.payment[0].paymentid },
          data: { payment_status: "REFUNDED" },
        })

        refundStatus = {
          success: true,
          refundId: refund.id,
          amount: refund.amount / 100,
        }
      } catch (refundError) {
        console.error("[v0] Stripe refund error:", refundError)
        return res.status(500).json({ error: "Failed to process refund" })
      }
    }

    // Delete room_availability records for this booking
    await prisma.room_availability.deleteMany({
      where: { bookingid: Number.parseInt(bookingId) },
    })

    // Update booking status to CANCELLED
    const updatedBooking = await prisma.booking.update({
      where: { bookingid: Number.parseInt(bookingId) },
      data: { booking_status: "CANCELLED" },
      include: {
        User: true,
        property: true,
        payment: true,
      },
    })

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
      refund: refundStatus,
    })
  } catch (error) {
    console.error("[v0] Error cancelling booking:", error)
    res.status(500).json({ error: "Failed to cancel booking" })
  }
}

// Get booking statistics for owner
const getOwnerBookingStats = async (req, res) => {
  try {
    const { ownerId } = req.params

    if (!ownerId) {
      return res.status(400).json({ error: "Owner ID is required" })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        property: {
          userid: Number.parseInt(ownerId),
        },
      },
    })

    const stats = {
      total: bookings.length,
      pending: bookings.filter((b) => b.booking_status === "PENDING").length,
      confirmed: bookings.filter((b) => b.booking_status === "CONFIRMED").length,
      completed: bookings.filter((b) => b.booking_status === "COMPLETED").length,
      cancelled: bookings.filter((b) => b.booking_status === "CANCELLED").length,
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("[v0] Error fetching booking stats:", error)
    res.status(500).json({ error: "Failed to fetch booking statistics" })
  }
}

export { getOwnerBookings,getBookingDetailsForOwner,confirmBooking,cancelBooking,getOwnerBookingStats} 

