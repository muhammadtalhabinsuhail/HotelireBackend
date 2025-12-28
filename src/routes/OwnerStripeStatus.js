import express from "express";
import Stripe from "stripe";
import prisma from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get owner Stripe Connect status and balance
router.get("/status", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const userId = req.user.user.userid;

    // Get owner info
    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!ownerInfo || !ownerInfo.stripe_connect_id) {
      return res.status(404).json({ error: "Owner has not connected Stripe" });
    }

    const account = await stripe.accounts.retrieve(ownerInfo.stripe_connect_id);

    // Ledger balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: ownerInfo.stripe_connect_id,
    });

    // Capabilities status
    const payoutsStatus = account.capabilities.transfers; // active, pending, restricted

    res.json({
      success: true,
      stripeConnectId: ownerInfo.stripe_connect_id,
      payoutsStatus,
      balanceAvailable: balance.available.map(b => ({
        currency: b.currency,
        amount: b.amount / 100,
      })),
      balancePending: balance.pending.map(b => ({
        currency: b.currency,
        amount: b.amount / 100,
      })),
    });
  } catch (err) {
    console.error("Stripe status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
