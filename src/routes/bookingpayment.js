import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";


dotenv.config();




const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// router.post("/create-intent", async (req, res) => {
//    const { amount } = req.body;

//   try {
//     const rawAmount = Number(amount);

//     if (Number.isNaN(rawAmount)) {
//       return res.status(400).json({ error: "Invalid amount" });
//     }

//     const stripeAmount = Math.round(rawAmount * 100);

//     if (stripeAmount > 99999999) {
//       return res.status(400).json({ error: "Amount exceeds Stripe limit" });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount * 100, // CAD → cents
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


router.post("/create-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const rawAmount = Number(amount);

    if (Number.isNaN(rawAmount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // convert to cents (INTEGER)
    const stripeAmount = Math.round(rawAmount * 100);

    if (stripeAmount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    if (stripeAmount > 99999999) {
      return res.status(400).json({ error: "Amount exceeds Stripe limit" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount, 
      currency: "cad",
      payment_method_types: ["card"],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



export default router;





// import Stripe from "stripe";
// import { NextResponse } from "next/server";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2023-10-16",
// });

// export async function POST(req: Request) {
//   try {
//     const { amount } = await req.json();

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount, // amount in cents
//       currency: "cad",
//       automatic_payment_methods: { enabled: true },
//     });

//     return NextResponse.json({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (err) {
//     return NextResponse.json(
//       { error: "Failed to create payment intent" },
//       { status: 500 }
//     );
//   }
// }