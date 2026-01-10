import { email } from "zod";
import prisma from "../config/prisma.js";
import Stripe from "stripe";
import { customerBookingConfirmedEmailTemplate } from "../utils/bookingConfirmedtoCustomerMail.js";
import { sendEmail } from "../utils/sendEmail.js";
import { bookingConfirmedEmailTemplate } from "../utils/bookingConfirmedtoOwnerMail.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPER_ADMIN_ACCOUNT = process.env.SUPER_ADMIN_STRIPE_ACCOUNT;

function toPrismaDate(dateStr) {
  const d = new Date(dateStr); // "January 23, 2026"
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0));
}

  const formatDate = (isoString) => {
    const date = new Date(isoString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months 0-based
    const year = date.getFullYear();

    return `${day}${month}${year}`;
  };

// This function is called after Stripe payment succeeds
const createBooking = async (req, res) => {
  try {
    const {
      userId,
      propertyId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      rooms,
      totalAmount,
      totalNights,
      paymentIntentId,
      chargeId,
    } = req.body





    console.log("getinggggggggg date", checkInDate);



    console.log("[v0] Creating booking with data:", {
      userId,
      propertyId,
      checkInDate,
      checkOutDate,
      rooms,
      totalAmount,
    })

    // Validate required fields
    if (!userId || !propertyId || !checkInDate || !checkOutDate || !rooms || !paymentIntentId) {
      return res.status(400).json({
        error: "Missing required fields",
      })
    }

    const user = await prisma.User.findUnique({
      where: { userid: userId },
    });


    if (!user) {
      return res.status(400).json({
        error: "User was not found",
      })
    }

    const property = await prisma.property.findUnique(
      {
        where: { propertyid: propertyId }
      }
    );

    if (!property) {
      return res.status(400).json({
        error: "Property was not found",
      })
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24
    const totalNightsCalculated = Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / MS_PER_DAY
    )

    if (totalNightsCalculated <= 0) {
      throw new Error("Invalid check-in / check-out dates")
    }




    // 🔐 STEP 0: VERIFY PAYMENT WITH STRIPE (MANDATORY)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(400).json({ error: "Invalid payment intent" });
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(402).json({
        error: "Payment not completed. Booking not created.",
      });
    }

    // OPTIONAL BUT STRONGLY RECOMMENDED
    if (paymentIntent.amount !== Math.round(Number(totalAmount) * 100)) {
      return res.status(400).json({
        error: "Payment amount mismatch",
      });
    }

    if (!paymentIntent.transfer_data?.destination) {
      return res.status(400).json({
        error: "Owner transfer not found",
      });
    }

    let newBookingdata;


    const result = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userid: userId,
          propertyid: propertyId,

          checkin_date: toPrismaDate(checkInDate),
          checkout_date: toPrismaDate(checkOutDate),


          adults: adults || 1,
          children: children || 0,
          total_nights: totalNightsCalculated,
          total_amount: Number(totalAmount),
          booking_status: "CONFIRMED",
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
      newBookingdata = newBooking;

      const payment = await tx.payment.create({
        data: {
          bookingid: newBooking.bookingid,
          paymentmethodid: 2,
          amount: Number(totalAmount),
          currency: "CAD",
          stripe_payment_intent_id: paymentIntentId,
          stripe_charge_id: chargeId,
          payment_status: "PAID",
          paid_at: new Date(),
          created_at: new Date(),
        },
      })

      const bookingRooms = await Promise.all(
        rooms.map((room) =>
          tx.booking_room.create({
            data: {
              bookingid: newBooking.bookingid,
              propertyroomid: room.roomId,
              room_price: Number(room.pricePerNight),
              room_count: Number(room.quantity),
              subtotal:
                Number(room.pricePerNight) *
                Number(room.quantity) *
                totalNightsCalculated,
            },
          })
        )
      )

      return { newBooking, payment, bookingRooms }
    })


    // 2️⃣ Non-transactional: room availability
    const availabilityData = []
    const currentDate = new Date(checkInDate)
    const checkoutDateObj = new Date(checkOutDate)

    while (currentDate < checkoutDateObj) {
      for (const room of rooms) {
        availabilityData.push({
          bookingid: result.newBooking.bookingid,
          propertyroomid: room.roomId,
          booked_date: new Date(currentDate),
          rooms_booked: room.quantity,
          created_at: new Date(),
        })
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // 🔥 Bulk insert (FAST)
    await prisma.room_availability.createMany({
      data: availabilityData,
    })

    console.log(" Room availability created:", availabilityData.length)







     const bookingId = `CONF-${newBookingdata.bookingid}-${formatDate(newBookingdata.created_at)}`;


    const total_guests = Number(adults) + Number(children);

    const bookingurl = `https://www.hotelire.ca/customer/hotel/${propertyId}/confirmation?bookingId=${newBookingdata.bookingid}`;


    await sendEmail(
      user.email,
      "Congratulations! your booking via Hotelire has been confirmed! 🎉",
      customerBookingConfirmedEmailTemplate(
        user.firstname,
        property.propertytitle,
        bookingId,
        checkInDate,
        checkOutDate,
        total_guests,
        bookingurl
      )
    );



    const owner = await prisma.User.findUnique(
      {
        where: {
          userid: property.userid
        }
      }
    )


    await sendEmail(
      owner.email,
      "Congratulations! You have got a booking via Hotelire! 🎉",
      bookingConfirmedEmailTemplate(
        owner.firstname,
        property.propertytitle,
        bookingId,
        checkInDate,
        checkOutDate
      )
    );









    res.status(201).json({
      success: true,
      bookingId: result.newBooking.bookingid,
      message: "Booking created successfully",
    })

  } catch (error) {
    console.error("[v0] Error creating booking:", error)
    res.status(500).json({
      error: "Failed to create booking",
      details: error.message,
    })
  }
}










// Used by BookingConfirmationPage to display booking information
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params

    console.log("[v0] Fetching booking details for ID:", bookingId)

    const booking = await prisma.booking.findUnique({
      where: { bookingid: Number.parseInt(bookingId) },
      include: {
        User: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true,
            phoneno: true,
            address: true,
          },
        },
        property: {
          select: {
            propertyid: true,
            propertytitle: true,
            address: true,
            checkintime: true,
            checkouttime: true,
            photo1_featured: true,
            propertymaplink: true,
            User: {
              select: {
                firstname: true,
                lastname: true,
                email: true,
                phoneno: true
              }
            }
          },
        },
        booking_room: {
          include: {
            propertyroom: {
              select: {
                propertyroomid: true,
                roomname: true,
                pic1: true,
                roomtype: {
                  select: {
                    roomtypeid: true,
                    roomtypename: true,
                  }
                }
              },
            },
          },
        },
        payment: {
          select: {
            paymentid: true,
            amount: true,
            currency: true,
            payment_status: true,
            paid_at: true,
            stripe_payment_intent_id: true,
          },
        },
      },
    })




    console.log('booking', booking);

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found",
      })
    }


    const response = {
      confirmationId: `CONF-${booking.bookingid}`,

      booking: {
        bookingId: booking.bookingid,
        status: booking.booking_status,
        createdAt: booking.created_at,
      },

      User: {
        firstName: booking.User.firstname,
        lastName: booking.User.lastname,
        email: booking.User.email,
        phone: booking.User.phoneno,
      },

      property: {
        id: booking.property.propertyid,
        name: booking.property.propertytitle,
        address: booking.property.address,
        image: booking.property.photo1_featured,
        checkInTime: booking.property.checkintime,
        checkOutTime: booking.property.checkouttime,
        propertymaplink: booking.property.propertymaplink,
        firstName: booking.property.User.firstname,
        lastName: booking.property.User.lastname,
        email: booking.property.User.email,
        phoneno: booking.property.User.phoneno
      },

      dates: {
        checkIn: booking.checkin_date,
        checkOut: booking.checkout_date,
        nights: booking.total_nights,
      },

      guests: {
        adults: booking.adults,
        children: booking.children,
        total: booking.total_guests,
      },

      rooms: booking.booking_room.map((br) => ({
        bookingRoomId: br.bookingroomid,
        roomId: br.propertyroomid,
        roomName: br.propertyroom?.roomname ?? "",
        roomType: br.propertyroom?.roomtype?.typename ?? "",
        quantity: br.room_count,
        pricePerNight: br.room_price.toString(),
        subtotal: br.subtotal.toString(),
        pic1: br.propertyroom.pic1
      })),

      payment: {
        total: booking.payment[0]?.amount.toString(),
        currency: booking.payment[0]?.currency,
        paymentStatus: booking.payment[0]?.payment_status,
        paymentMethod: "Stripe",
      },
    }

    console.log('response', response);

    res.json({
      success: true,
      data: response,
    })
    // res.status(200).json({
    //   success: true,
    //   data: booking,
    // })
  } catch (error) {
    console.error("[v0] Error fetching booking details:", error)
    res.status(500).json({
      error: "Failed to fetch booking details",
      details: error.message,
    })
  }
}

// When booking is cancelled, delete related room_availability records
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params

    console.log("[v0] Cancelling booking ID:", bookingId)

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Update booking status to "CANCELLED"
      const booking = await tx.booking.update({
        where: { bookingid: Number.parseInt(bookingId) },
        data: {
          booking_status: "CANCELLED",
          updated_at: new Date(),
        },
      })

      // 2. Delete room_availability records for this booking
      const deletedAvailability = await tx.room_availability.deleteMany({
        where: { bookingid: Number.parseInt(bookingId) },
      })

      console.log("[v0] Deleted room availability records:", deletedAvailability.count)

      return { booking, deletedCount: deletedAvailability.count }
    })

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
    })
  } catch (error) {
    console.error("[v0] Error cancelling booking:", error)
    res.status(500).json({
      error: "Failed to cancel booking",
      details: error.message,
    })
  }
}

// This should be called by a cron job daily
const completeExpiredBookings = async (req, res) => {
  try {
    console.log("[v0] Running cron job to complete expired bookings")

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all bookings with checkout date <= today and status "CONFIRMED"
    const expiredBookings = await prisma.booking.findMany({
      where: {
        checkout_date: {
          lte: today,
        },
        booking_status: "CONFIRMED",
      },
    })

    console.log("[v0] Found expired bookings:", expiredBookings.length)

    // Update each expired booking to "COMPLETED" and delete room_availability
    const results = await Promise.all(
      expiredBookings.map(async (booking) => {
        return await prisma.$transaction(async (tx) => {
          // 1. Update booking status to "COMPLETED"
          const updatedBooking = await tx.booking.update({
            where: { bookingid: booking.bookingid },
            data: {
              booking_status: "COMPLETED",
              updated_at: new Date(),
            },
          })

          // 2. Delete room_availability records for this booking
          const deletedAvailability = await tx.room_availability.deleteMany({
            where: { bookingid: booking.bookingid },
          })

          console.log(
            `[v0] Booking ${booking.bookingid} completed, deleted ${deletedAvailability.count} availability records`,
          )

          return { bookingid: booking.bookingid, deletedCount: deletedAvailability.count }
        })
      }),
    )

    res.status(200).json({
      success: true,
      message: `Completed ${results.length} expired bookings`,
      data: results,
    })
  } catch (error) {
    console.error("[v0] Error in cron job:", error)
    res.status(500).json({
      error: "Failed to complete expired bookings",
      details: error.message,
    })
  }
}





const getUserBookings = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      })
    }

    const userid = req.user.user.userid

    console.log("[v0] Fetching bookings for user:", userid)

    // Fetch all bookings for the user with necessary relations
    const bookings = await prisma.booking.findMany({
      where: {
        userid: userid,
      },
      include: {
        property: {
          select: {
            propertyid: true,
            propertytitle: true,
            photo1_featured: true,
          },
        },
        booking_room: {
          include: {
            propertyroom: {
              select: {
                roomname: true,
                roomtype: {
                  select: {
                    roomtypename: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc", // Most recent bookings first
      },
    })

    console.log("[v0] Found bookings:", bookings.length)

    // Format bookings for frontend
    const formattedBookings = bookings.map((booking) => ({
      id: booking.bookingid.toString(),
      bookingId: `CONF-${booking.bookingid}`,
      hotelName: booking.property?.propertytitle || "Property",
      propertyImage: booking.property?.photo1_featured || "",
      checkInDate: new Date(booking.checkin_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      checkOutDate: new Date(booking.checkout_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      totalNights: booking.total_nights,
      totalAmount: Number(booking.total_amount),
      status:
        booking.booking_status === "CONFIRMED"
          ? "Confirmed"
          : booking.booking_status === "COMPLETED"
            ? "Completed"
            : booking.booking_status === "CANCELLED"
              ? "Cancelled"
              : "Confirmed",
    }))

    res.status(200).json({
      success: true,
      bookings: formattedBookings,
    })
  } catch (error) {
    console.error("[v0] Error fetching user bookings:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch bookings",
      details: error.message,
    })
  }
}



export {
  createBooking,
  getBookingDetails,
  cancelBooking,
  completeExpiredBookings,
  getUserBookings
}; 
