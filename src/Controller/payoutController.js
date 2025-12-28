// import prisma from "../config/prisma.js";
// import dotenv from "dotenv";

// dotenv.config();

// // Save or update owner's Stripe Connect account details
// const savePayoutDetails = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const { stripeConnectAccountId, payoutSchedule, minimumPayoutAmount } =
//       req.body;
//     const userId = req.user.user.userid;

//     // Validate required fields
//     if (!stripeConnectAccountId) {
//       return res.status(400).json({
//         error: "Stripe Connect Account ID is required",
//       });
//     }

//     // Validate Stripe Connect ID format
//     if (!stripeConnectAccountId.startsWith("acct_")) {
//       return res.status(400).json({
//         error: "Invalid Stripe Connect Account ID format",
//       });
//     }

//     // Get owner info
//     const ownerInfo = await prisma.ownerinfo.findUnique({
//       where: { userid: userId },
//     });

//     if (!ownerInfo) {
//       return res.status(404).json({
//         error: "Owner information not found",
//       });
//     }

//     // Update payout details
//     const updated = await prisma.ownerinfo.update({
//       where: { ownerid: ownerInfo.ownerid },
//       data: {
//         stripe_connect_id: stripeConnectAccountId,
//         payout_schedule: payoutSchedule || "monthly",
//         minimum_payout_amount: minimumPayoutAmount || 10,
//         updated_at: new Date(),
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Payout details saved successfully",
//       payout: {
//         stripeConnectAccountId: updated.stripe_connect_id,
//         payoutSchedule: updated.payout_schedule,
//         minimumPayoutAmount: updated.minimum_payout_amount,
//       },
//     });
//   } catch (error) {
//     console.log("Save payout details error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get owner's payout details
// const getPayoutDetails = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const userId = req.user.user.userid;

//     const ownerInfo = await prisma.ownerinfo.findUnique({
//       where: { userid: userId },
//       select: {
//         stripe_connect_id: true,
//         payout_schedule: true,
//         minimum_payout_amount: true,
//       },
//     });

//     if (!ownerInfo) {
//       return res.status(404).json({
//         error: "Owner information not found",
//       });
//     }

//     res.json({
//       success: true,
//       payout: {
//         stripeConnectAccountId: ownerInfo.stripe_connect_id,
//         payoutSchedule: ownerInfo.payout_schedule || "monthly",
//         minimumPayoutAmount: ownerInfo.minimum_payout_amount || 10,
//       },
//     });
//   } catch (error) {
//     console.error("Get payout details error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// export { savePayoutDetails, getPayoutDetails };



import Stripe from "stripe";

import prisma from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const connectStripeAccount = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        console.log('stripe',stripe);
        
        const userId = req.user.user.userid;

        const ownerInfo = await prisma.ownerinfo.findUnique({
            where: { userid: userId },
        });

        if (!ownerInfo) {
            return res.status(404).json({ error: "Owner not found" });
        }

        let connectAccountId = ownerInfo.stripe_connect_id;



        // Create Stripe Connect account if not exists
        if (!connectAccountId) {
            const account = await stripe.accounts.create({
                type: "express",
                country: "CA",
                email: req.user.user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            connectAccountId = account.id;

            await prisma.ownerinfo.update({
                where: { ownerid: ownerInfo.ownerid },
                data: { stripe_connect_id: connectAccountId },
            });
        }

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
            account: connectAccountId,
            refresh_url: `${process.env.FRONTEND_URL}/owner/settings`,
            return_url: `${process.env.FRONTEND_URL}/owner/settings`,
            type: "account_onboarding",
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        console.log("Stripe connect error:", error.message);
        res.status(500).json({ error: error.message });
    }
};



// Get owner's payout details
const getPayoutDetails = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User is not authenticated" });
        }

        const userId = req.user.user.userid;

        const ownerInfo = await prisma.ownerinfo.findUnique({
            where: { userid: userId },
            select: {
                stripe_connect_id: true,
                payout_schedule: true,
                minimum_payout_amount: true,
            },
        });

        if (!ownerInfo) {
            return res.status(404).json({
                error: "Owner information not found",
            });
        }

        res.json({
            success: true,
            payout: {
                stripeConnectAccountId: ownerInfo.stripe_connect_id,
                payoutSchedule: ownerInfo.payout_schedule || "monthly",
                minimumPayoutAmount: ownerInfo.minimum_payout_amount || 10,
            },
        });
    } catch (error) {
        console.log("Get payout details error:", error.message);
        res.status(500).json({ error: error.message });
    }
};



export { connectStripeAccount, getPayoutDetails }