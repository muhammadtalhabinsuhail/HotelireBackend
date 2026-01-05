// import express from "express";
// import Stripe from "stripe";
// import prisma from "../config/prisma.js";

// const router = express.Router();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     let event;

//     console.log("🎯 STRIPE WEBHOOK RECEIVED");

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         req.headers["stripe-signature"],
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     } catch (err) {
//       console.log("❌ Signature verification failed:", err.message);
//       return res.sendStatus(400);
//     }

//     const obj = event.data.object;

//     // -----------------------------
//     // HANDLE SUBSCRIPTION OBJECTS
//     // -----------------------------
//     if (obj.object === "subscription") {
//       const subscriptionId = obj.id?.trim();
//       const status = obj.status;

//       console.log("📌 SUBSCRIPTION EVENT STATUS:", status);

//       // update owner by subscription_id ONLY
//       const updated = await prisma.ownerinfo.updateMany({
//         where: { subscription_id: subscriptionId },
//         data: {
//           subscription_status: status,
//         },
//       });

//       console.log("📝 DB UPDATED subscription_status ->", status);

//       // toggle property active flag
//       const deactivateStatuses = [
//         "incomplete",
//         "incomplete_expired",
//         "past_due",
//         "canceled",
//         "unpaid",
//       ];

//       const activate = !deactivateStatuses.includes(status);





//       // const owners = await prisma.ownerinfo.findMany({
//       //   select: { ownerid: true, subscription_id: true },
//       // });

//       // console.log("📦 OWNERS IN THIS DB = ", owners);


//       const owner = await prisma.ownerinfo.findFirst({
//         where: { subscription_id: subscriptionId },
//       });

//       if (!owner) {

//         // 2️⃣ Try via metadata (race condition fix)
//         const metaUserId = eventObject.metadata?.userId;
//         const metaOwnerId = eventObject.metadata?.ownerId;

//         if (metaOwnerId) {
//           owner = await prisma.ownerinfo.findUnique({
//             where: { ownerid: Number(metaOwnerId) }
//           });
//         } else if (metaUserId) {
//           owner = await prisma.ownerinfo.findFirst({
//             where: { userid: Number(metaUserId) }
//           });
//         }

//         if (owner) {
//           console.log("✅ Matched via metadata");
//           return owner;
//         }

//         // 3️⃣ Retry once after delay (DB write race)
//         console.log("⏳ Waiting 3 seconds and retrying…");

//         await new Promise(r => setTimeout(r, 3000));

//         return prisma.ownerinfo.findFirst({
//           where: { subscription_id: subscriptionId }
//         });

//       }

//       const userId = owner.userid;

//       // 2️⃣ update ALL properties of this user
//       await prisma.property.updateMany({
//         where: { userid: userId },
//         data: { is_active: activate },
//       });

//       console.log(
//         `🏡 Properties updated for user ${userId} -> is_active = ${activate}`
//       );













//       console.log(
//         activate
//           ? "✅ Properties Activated"
//           : "⛔ Properties Deactivated"
//       );

//       return res.json({ received: true });
//     }

//     // -----------------------------
//     // HANDLE INVOICE-BASED EVENTS
//     // -----------------------------
//     if (obj.object === "invoice" && obj.subscription) {
//       const subscriptionId = obj.subscription;

//       // get subscription status from Stripe to avoid confusion
//       const subscription = await stripe.subscriptions.retrieve(subscriptionId);
//       const status = subscription.status;

//       console.log("📌 INVOICE EVENT → subscription status:", status);

//       await prisma.ownerinfo.updateMany({
//         where: { subscription_id: subscriptionId },
//         data: {
//           subscription_status: status,

//         },
//       });

//       return res.json({ received: true });
//     }

//     // -----------------------------
//     // CHARGE EVENTS (backup case)
//     // -----------------------------
//     if (obj.object === "charge" && obj.billing_details) {
//       if (obj.invoice) {
//         const invoice = await stripe.invoices.retrieve(obj.invoice);
//         const subscriptionId = invoice.subscription;

//         if (subscriptionId) {
//           const subscription = await stripe.subscriptions.retrieve(
//             subscriptionId
//           );

//           await prisma.ownerinfo.updateMany({
//             where: { subscription_id: subscriptionId },
//             data: { subscription_status: subscription.status },
//           });

//           console.log(
//             "📌 CHARGE EVENT updated status:",
//             subscription.status
//           );
//         }
//       }
//     }

//     return res.json({ received: true });
//   }
// );

// export default router;



import express from "express";
import Stripe from "stripe";
import prisma from "../config/prisma.js";
import { sendEmail } from "../utils/sendEmail.js";
import { subscriptionActivatedEmailTemplate } from "../utils/subscriptionActivatedMail.js";
import { subscriptionExpiredEmailTemplate } from "../utils/subscriptionFailedMail.js";


const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ----------------------------------------------
// SAFE OWNER FIND FUNCTION (handles race problem)
// ----------------------------------------------
async function findOwner(obj) {
  const subscriptionId = obj.id;

  // 1️⃣ Normal way — subscription_id stored already
  let owner = await prisma.ownerinfo.findFirst({
    where: { subscription_id: subscriptionId }
  });

  if (owner) {
    console.log("✅ Found owner via subscription_id");
    return owner;
  }

  console.log("⚠️ Owner not found — trying metadata fallback…");

  // 2️⃣ Metadata fallback (race condition solution)
  const metaUserId = obj.metadata?.userId;
  const metaOwnerId = obj.metadata?.ownerId;

  if (metaOwnerId) {
    owner = await prisma.ownerinfo.findUnique({
      where: { ownerid: Number(metaOwnerId) }
    });
  } else if (metaUserId) {
    owner = await prisma.ownerinfo.findFirst({
      where: { userid: Number(metaUserId) }
    });
  }

  if (owner) {
    console.log("✅ Found owner via metadata");
    return owner;
  }

  // 3️⃣ DB is still writing — retry once after 3 sec
  console.log("⏳ Retrying after 3 seconds…");

  await new Promise(r => setTimeout(r, 3000));

  return prisma.ownerinfo.findFirst({
    where: { subscription_id: subscriptionId }
  });
}

// ----------------------------------------------

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    console.log("🎯 STRIPE WEBHOOK RECEIVED");

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log("❌ Signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    const obj = event.data.object;

    // ===============================
    // SUBSCRIPTION EVENTS
    // ===============================
    if (obj.object === "subscription") {
      const subscriptionId = obj.id;
      const status = obj.status;

      console.log("📌 Subscription status:", status);

      const owner = await findOwner(obj);

      if (!owner) {
        console.log("❌ No owner found. Skipping.");
        return res.json({ received: true });
      }

      // update owner record
      await prisma.ownerinfo.update({
        where: { ownerid: owner.ownerid },
        data: {
          subscription_id: subscriptionId,
          subscription_status: status,
        }
      });

      // determine active / inactive
      const badStatuses = [
        "incomplete",
        "incomplete_expired",
        "past_due",
        "canceled",
        "unpaid"
      ];

      const activate = !badStatuses.includes(status);

      // update ALL properties of this user
      await prisma.property.updateMany({
        where: { userid: owner.userid },
        data: { is_active: activate }
      });


      const user = await prisma.User.findFirst({
        where: {
          userid: Number(owner.userid),
        },
      });

      console.log(user, "........")


      if (activate) {



        await sendEmail(
          user.email,
          "Your Hotelire Subscription is Activated 🎉",
          subscriptionActivatedEmailTemplate(user.firstname)
        );

        console.log()
      }

      if (!activate) {
        await sendEmail(
          user.email,
          "Your Hotelire Subscription is not Activated",
          subscriptionExpiredEmailTemplate(user.firstname)
        );
      }


      console.log(
        activate
          ? "✅ Properties activated"
          : "⛔ Properties deactivated"
      );

      return res.json({ received: true });
    }

    // ===============================
    // INVOICE EVENTS (backup)
    // ===============================
    if (obj.object === "invoice" && obj.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        obj.subscription
      );

      await prisma.ownerinfo.updateMany({
        where: { subscription_id: obj.subscription },
        data: { subscription_status: subscription.status }
      });
    }

    return res.json({ received: true });
  }
);

export default router;
