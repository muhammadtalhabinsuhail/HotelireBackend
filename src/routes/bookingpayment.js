// import express from "express";
// import Stripe from "stripe";
// import dotenv from "dotenv";


// dotenv.config();




// const router = express.Router();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// // router.post("/create-intent", async (req, res) => {
// //    const { amount } = req.body;

// //   try {
// //     const rawAmount = Number(amount);

// //     if (Number.isNaN(rawAmount)) {
// //       return res.status(400).json({ error: "Invalid amount" });
// //     }

// //     const stripeAmount = Math.round(rawAmount * 100);

// //     if (stripeAmount > 99999999) {
// //       return res.status(400).json({ error: "Amount exceeds Stripe limit" });
// //     }

// //     const paymentIntent = await stripe.paymentIntents.create({
// //       amount: amount * 100, // CAD → cents
// //       currency: "cad",
// //       payment_method_types: ["card"],
// //     });

// //     res.json({
// //       clientSecret: paymentIntent.client_secret,
// //     });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });


// router.post("/create-intent", async (req, res) => {
//   const { amount } = req.body;

//   try {
//     const rawAmount = Number(amount);

//     if (Number.isNaN(rawAmount)) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     // convert to cents (INTEGER)
//     const stripeAmount = Math.round(rawAmount * 100);

//     if (stripeAmount <= 0) {
//       return res.status(400).json({ error: "Amount must be greater than 0" });
//     }

//     if (stripeAmount > 99999999) {
//       return res.status(400).json({ error: "Amount exceeds Stripe limit" });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: stripeAmount, 
//       currency: "cad",
//       payment_method_types: ["card"],
//     });

//     res.json({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// export default router;





// // import Stripe from "stripe";
// // import { NextResponse } from "next/server";

// // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// //   apiVersion: "2023-10-16",
// // });

// // export async function POST(req: Request) {
// //   try {
// //     const { amount } = await req.json();

// //     const paymentIntent = await stripe.paymentIntents.create({
// //       amount, // amount in cents
// //       currency: "cad",
// //       automatic_payment_methods: { enabled: true },
// //     });

// //     return NextResponse.json({
// //       clientSecret: paymentIntent.client_secret,
// //     });
// //   } catch (err) {
// //     return NextResponse.json(
// //       { error: "Failed to create payment intent" },
// //       { status: 500 }
// //     );
// //   }
// // }






import express from "express";
import Stripe from "stripe";
import prisma from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPER_ADMIN_ACCOUNT = process.env.SUPER_ADMIN_STRIPE_ACCOUNT;

// Create payment intent for customer booking payment with destination charge to owner
router.post("/create-intent", async (req, res) => {
  const { amount, propertyId } = req.body;

  try {
    const rawAmount = Number(amount);

    if (Number.isNaN(rawAmount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    // convert to cents (INTEGER)
    const stripeAmount = Math.round(rawAmount * 100);

    if (stripeAmount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (stripeAmount > 99999999) {
      return res.status(400).json({ error: "Amount exceeds Stripe limit" });
    }

    // Get property details and owner's Stripe Connect account
    const property = await prisma.property.findUnique({
      where: { propertyid: propertyId },
      include: {
        User: {
          include: { ownerinfo: true },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const ownerConnectAccount = property.User?.ownerinfo?.stripe_connect_id;

    if (!ownerConnectAccount) {
      return res.status(400).json({
        error: "Property owner has not set up their Stripe Connect account. Payment cannot be processed.",
      });
    }

    // Calculate fees: 2.9% + $0.30 CAD goes to super admin
    const applicationFeeAmount = Math.round(stripeAmount * 0.029 + 30);

    // Create payment intent with destination charge to owner
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: stripeAmount,
    //   currency: "cad",
    //   payment_method_types: ["card"],
    //   application_fee_amount: applicationFeeAmount,
    //   transfer_data: {
    //     destination: ownerConnectAccount,
    //   },
    //   metadata: {
    //     propertyId: propertyId,
    //     ownerId: property.userid,
    //   },
    // });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "cad",
      payment_method_types: ["card"],

      // PLATFORM FEE
      application_fee_amount: applicationFeeAmount,

      // 💰 REAL DESTINATION
      transfer_data: {
        destination: ownerConnectAccount,
      },

      metadata: {
        propertyId: propertyId,
        ownerId: property.userid,
      },
    });


    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: rawAmount,
      currency: "CAD",
      ownerAccount: ownerConnectAccount,
    });
  } catch (err) {
    console.error("Payment intent error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment and create booking record
router.post("/confirm", async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        error: "paymentIntentId and bookingId are required",
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        error: "Payment was not successful",
      });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { bookingid: bookingId },
      data: {
        booking_status: "CONFIRMED",
      },
    });

    res.json({
      success: true,
      message: "Payment confirmed and booking updated",
      booking: {
        bookingId: updatedBooking.bookingid,
        status: updatedBooking.booking_status,
      },
    });
  } catch (err) {
    console.error("Payment confirmation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;



