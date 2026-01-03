import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendMail.js";
import { getReviewEmailTemplate } from "../utils/reviewEmailTemplate.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const FRONTEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Generate review token (expires in 24 hours)
const generateReviewToken = (userId, bookingId, propertyId) => {
  return jwt.sign(
    { userId, bookingId, propertyId },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Verify review token
const verifyReviewToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Send review email to customer after booking completion
const sendReviewEmail = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { bookingid: bookingId },
      include: {
        User: true,
        property: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if booking is completed (checkout date has passed)
    const now = new Date();
    const checkoutDate = new Date(booking.checkout_date);

    if (now <= checkoutDate) {
      return res.status(400).json({
        error: "Review email can only be sent after checkout date",
      });
    }

    // Get or create review record
    let review = await prisma.review.findFirst({
      where: {
        booking: {
          bookingid: bookingId
        }
      }
    });

    // If review doesn't exist, create it
    if (!review) {
      review = await prisma.review.create({
        data: {
          booking: {
            connect: { bookingid: bookingId }
          },
          property: {
            connect: { propertyid: booking.propertyid }
          },
          User: {
            connect: { userid: booking.userid }
          },
          rating: 1,  // Rating will be filled when user submits review
          review_requested: false,
          review_submitted: false,
        },
      });
    }

    // Check if review email already sent
    if (review.review_requested) {
      return res.status(400).json({
        error: "Review email already sent for this booking",
      });
    }

    // Check if review already submitted
    if (review.review_submitted) {
      return res.status(400).json({
        error: "Review already submitted for this booking",
      });
    }

    // Generate review token
    const reviewToken = generateReviewToken(
      booking.userid,
      bookingId,
      booking.propertyid
    );

    // Create review URL
    const reviewUrl = `${FRONTEND_URL}/customer/review?token=${reviewToken}`;

    // Send email using sendEmail utility from sendMail.js
    const emailContent = getReviewEmailTemplate(
      `${booking.User.firstname} ${booking.User.lastname}`,
      booking.property.propertytitle,
      reviewToken,
      reviewUrl
    );

    await sendEmail(booking.User.email, "Share Your Hotelire Experience", emailContent);

    // Mark review_requested as true
    await prisma.review.update({
      where: { id: review.id },
      data: { review_requested: true },
    });

    res.json({
      success: true,
      message: "Review email sent successfully",
    });
  } catch (error) {
    console.error("Send review email error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Automatically send review emails for completed bookings (scheduled job)
const sendReviewEmailsForCompletedBookings = async (req, res) => {
  try {
    const now = new Date();

    // Find all completed bookings where checkout date has passed and review email not yet sent
    const completedBookings = await prisma.booking.findMany({
      where: {
        booking_status: "COMPLETED",
        checkout_date: {
          lt: now, // checkout date is in the past
        },
      },
      include: {
        User: true,
        property: true,
      },
    });

    console.log(`[Review] Found ${completedBookings.length} completed bookings`);

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
          }
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
              rating: 1,  // Rating will be filled when user submits review
              review_requested: false,
              review_submitted: false,
            },
          });
        }

        // Skip if review already requested or submitted
        if (review.review_requested || review.review_submitted) {
          console.log(
            `[Review] Skipping booking ${booking.bookingid} - email already sent or review submitted`
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

        // Send email
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

        // Mark review_requested as true
        await prisma.review.update({
          where: { id: review.id },
          data: { review_requested: true },
        });

        console.log(
          `[Review] Email sent for booking ${booking.bookingid} to ${booking.User.email}`
        );
        emailsSent++;
      } catch (error) {
        console.error(
          `[Review] Error sending email for booking ${booking.bookingid}:`,
          error.message
        );
        errors.push({
          bookingId: booking.bookingid,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Review emails processed`,
      emailsSent,
      totalBookings: completedBookings.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error(
      "Send review emails for completed bookings error:",
      error.message
    );
    res.status(500).json({ error: error.message });
  }
};

// Get review details from token (for frontend)
const getReviewPageData = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Review token is required" });
    }

    // Verify token
    const decoded = verifyReviewToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Review link has expired" });
    }

    // Get booking and property details
    const booking = await prisma.booking.findUnique({
      where: { bookingid: decoded.bookingId },
      include: {
        property: true,
        User: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if review already submitted
    const existingReview = await prisma.review.findFirst({
      where: {
        booking: {
          bookingid: decoded.bookingId
        }
      }
    });

    if (existingReview && existingReview.review_submitted) {
      return res.status(400).json({ error: "Review already submitted" });
    }

    res.json({
      success: true,
      data: {
        bookingId: booking.bookingid,
        propertyId: booking.propertyid,
        userId: booking.userid,
        propertyName: booking.property.propertytitle,
        checkInDate: booking.checkin_date,
        checkOutDate: booking.checkout_date,
        guestName: `${booking.User.firstname} ${booking.User.lastname}`,
      },
    });
  } catch (error) {
    console.error("Get review page data error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Submit review
const submitReview = async (req, res) => {
  try {
    const { token, rating, comment, isPublic } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Review token is required" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Verify token
    const decoded = verifyReviewToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Review link has expired" });
    }

    // Check if review already submitted
    const existingReview = await prisma.review.findFirst({
      where: {
        booking: {
          bookingid: decoded.bookingId
        }
      }
    });

    if (existingReview && existingReview.review_submitted) {
      return res.status(400).json({ error: "Review already submitted" });
    }

    // Validate booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { bookingid: decoded.bookingId },
    });

    if (!booking || booking.userid !== decoded.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Create or update review
    let newReview;
    
    if (existingReview) {
      // Update existing review
      newReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: parseInt(rating),
          comment: comment || null,
          is_public: isPublic !== false,
          review_submitted: true,
        },
      });
    } else {
      // Create new review
      newReview = await prisma.review.create({
        data: {
          booking: {
            connect: { bookingid: decoded.bookingId }
          },
          property: {
            connect: { propertyid: decoded.propertyId }
          },
          User: {
            connect: { userid: decoded.userId }
          },
          rating: parseInt(rating) || 1,
          comment: comment || null,
          is_public: isPublic !== false,
          review_requested: true,
          review_submitted: true,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: {
        id: newReview.id,
        bookingId: newReview.bookingid,
        rating: newReview.rating,
        comment: newReview.comment,
        isPublic: newReview.is_public,
      },
    });
  } catch (error) {
    console.log(error)
    console.error("Submit review error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get reviews for a property (public)
// const getPropertyReviews = async (req, res) => {
//   try {
//     const { propertyId } = req.params;

//     if (!propertyId) {
//       return res.status(400).json({ error: "Property ID is required" });
//     }

//     const reviews = await prisma.review.findMany({
//       where: {
//         propertyid: parseInt(propertyId),
//         is_public: true,
//       },
//       include: {
//         User: {
//           select: {
//             userid: true,
//             firstname: true,
//             lastname: true,
//             profilepic: true,
//           },
//         },
//       },
//       orderBy: {
//         created_at: "desc",
//       },
//     });

//     // Calculate average rating
//     const averageRating =
//       reviews.length > 0
//         ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
//         : 0;

//     res.json({
//       success: true,
//       propertyId,
//       averageRating,
//       totalReviews: reviews.length,
//       reviews: reviews.map((r) => ({
//         id: r.id,
//         rating: r.rating,
//         comment: r.comment,
//         guestName: `${r.User.firstname} ${r.User.lastname}`,
//         guestImage: r.User.profilepic,
//         createdAt: r.created_at,
//       })),
//     });
//   } catch (error) {
//     console.error("Get property reviews error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };






 const getOwnerReviews = async (req, res) => {
  try {
    // UserID from the authenticated token (req.user structure based on your description)
    const ownerId = req.user.user.userid;

    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    // Find all reviews where the property belongs to this owner
    const reviews = await prisma.review.findMany({
      where: {
        property: {
          userid: Number(ownerId), // property.userid matches the owner's ID
        },
      },
      include: {
        User: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true,
            profilepic: true,
          },
        },
        property: {
          select: {
            propertyid: true,
            propertytitle: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Format the response for the frontend
    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      guestName: `${r.User.firstname} ${r.User.lastname}`,
      guestAvatar: (r.User.firstname?.[0] || "") + (r.User.lastname?.[0] || ""), // Initials
      guestEmail: r.User.email,
      property: r.property.propertytitle,
      date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : "", // YYYY-MM-DD
      rating: r.rating || 0,
      text: r.comment || "",
    }));

    res.json({
      success: true,
      count: formattedReviews.length,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Get owner reviews error:", error.message);
    res.status(500).json({ error: error.message });
  }
};



 const getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    const reviews = await prisma.review.findMany({
      where: {
        property_id: Number(propertyId),
        is_public: true, // Only public reviews
      },
      include: {
        User: {
          select: {
            userid: true,
            firstname: true,
            lastname: true,
            email: true, // Requested by user to show email
            profilepic: true,
          },
        },
        property: {
          select: {
            propertyid: true,
            propertytitle: true,
          }
        }
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      guestName: `${r.User.firstname} ${r.User.lastname}`,
      guestAvatar: (r.User.firstname?.[0] || "") + (r.User.lastname?.[0] || ""),
      guestEmail: r.User.email,
      property: r.property.propertytitle,
      date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : "",
      rating: r.rating || 0,
      text: r.comment || "",
    }));

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";

    res.json({
      success: true,
      propertyId,
      propertyName: reviews[0]?.property?.propertytitle || "",
      averageRating,
      totalReviews: reviews.length,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("Get property reviews error:", error.message);
    res.status(500).json({ error: error.message });
  }
};



export {
  sendReviewEmail,
  sendReviewEmailsForCompletedBookings,
  getReviewPageData,
  submitReview,
  getPropertyReviews,
  generateReviewToken,
  verifyReviewToken,
  getOwnerReviews
};
