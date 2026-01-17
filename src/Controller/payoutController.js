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

        console.log('stripe', stripe);

        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("Stripe secret key missing");
        }


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

                metadata: {
                    userId: String(userId),
                    ownerId: String(ownerInfo.ownerid),
                },
            });

            connectAccountId = account.id;

            await prisma.ownerinfo.update({
                where: { ownerid: ownerInfo.ownerid },
                data: { stripe_connect_id: connectAccountId },
            });

            await prisma.property.updateMany({
                where: { userid: ownerInfo.userid },
                data: {
                    is_active_byConnectId: true
                }
            })


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