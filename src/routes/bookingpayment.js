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

    // Create payment intent with destination charge to owner
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: "cad",
      automatic_payment_methods: { enabled: true },
      transfer_data: {
        destination: ownerConnectAccount,
      },
      transfer_group: `property_${propertyId}`,   //Helps refunds & reconciliation:
      on_behalf_of: ownerConnectAccount,   //puts tax responsibility on owner

      statement_descriptor_suffix: "HOTELIRE",
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



