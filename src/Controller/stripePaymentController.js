// import Stripe from "stripe";
// import prisma from "../config/prisma.js";
// import dotenv from "dotenv";

// dotenv.config();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const SUPER_ADMIN_STRIPE_ACCOUNT = process.env.SUPER_ADMIN_STRIPE_ACCOUNT;

// // ==================== FLOW-A: Owner Subscription Payment ====================
// // Owner pays CAD 10/month for property listing using Stripe Subscriptions

// const createOwnerSubscription = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const { paymentMethodId } = req.body;
//     const userId = req.user.user.userid;

//     if (!paymentMethodId) {
//       return res.status(400).json({ error: "Payment method is required" });
//     }

//     // Check if owner exists
//     const ownerInfo = await prisma.ownerinfo.findUnique({
//       where: { userid: userId },
//     });

//     if (!ownerInfo) {
//       return res.status(404).json({ error: "Owner information not found" });
//     }

//     // Create Stripe customer for owner if not exists
//     let stripeCustomerId = ownerInfo.stripe_customer_id;
    
//     if (!stripeCustomerId) {
//       const user = await prisma.User.findUnique({
//         where: { userid: userId },
//       });

//       const customer = await stripe.customers.create({
//         email: user.email,
//         name: ownerInfo.legalfullname,
//         metadata: { ownerid: ownerInfo.ownerid, userid: userId },
//       });

//       stripeCustomerId = customer.id;

//       // Save customer ID in database
//       await prisma.ownerinfo.update({
//         where: { ownerid: ownerInfo.ownerid },
//         data: { stripe_customer_id: stripeCustomerId },
//       });
//     }

//     // Attach payment method to customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: stripeCustomerId,
//     });

//     // Set as default payment method
//     await stripe.customers.update(stripeCustomerId, {
//       invoice_settings: { default_payment_method: paymentMethodId },
//     });

//     // Create subscription for CAD 10/month
//     const subscription = await stripe.subscriptions.create({
//       customer: stripeCustomerId,
//       items: [
//         {
//           price_data: {
//             currency: "cad",
//             product_data: {
//               name: "Property Listing - Monthly Subscription",
//               description: "Monthly subscription for property listing activation",
//             },
//             recurring: { interval: "month", interval_count: 1 },
//             unit_amount: 1000, // CAD 10 in cents
//           },
//         },
//       ],
//       payment_settings: {
//         payment_method_types: ["card"],
//         default_mandate_id: paymentMethodId,
//       },
//     });

//     // Save subscription details in database
//     const subscriptionRecord = await prisma.owner_subscription.create({
//       data: {
//         ownerid: ownerInfo.ownerid,
//         stripe_subscription_id: subscription.id,
//         stripe_customer_id: stripeCustomerId,
//         amount: 10,
//         currency: "CAD",
//         status: subscription.status,
//         current_period_start: new Date(subscription.current_period_start * 1000),
//         current_period_end: new Date(subscription.current_period_end * 1000),
//         created_at: new Date(),
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: "Subscription created successfully",
//       subscription: {
//         subscriptionId: subscription.id,
//         status: subscription.status,
//         amount: 10,
//         currency: "CAD",
//         nextBillingDate: new Date(subscription.current_period_end * 1000),
//       },
//     });
//   } catch (error) {
//     console.error("Subscription creation error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// const cancelOwnerSubscription = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const userId = req.user.user.userid;

//     const ownerInfo = await prisma.ownerinfo.findUnique({
//       where: { userid: userId },
//     });

//     if (!ownerInfo) {
//       return res.status(404).json({ error: "Owner information not found" });
//     }

//     const activeSubscription = await prisma.owner_subscription.findFirst({
//       where: {
//         ownerid: ownerInfo.ownerid,
//         status: { in: ["active", "trialing"] },
//       },
//     });

//     if (!activeSubscription) {
//       return res.status(404).json({ error: "No active subscription found" });
//     }

//     // Cancel subscription in Stripe
//     const canceledSubscription = await stripe.subscriptions.del(
//       activeSubscription.stripe_subscription_id
//     );

//     // Update database record
//     await prisma.owner_subscription.update({
//       where: { subscription_id: activeSubscription.subscription_id },
//       data: { status: "canceled" },
//     });

//     res.json({
//       success: true,
//       message: "Subscription canceled successfully",
//     });
//   } catch (error) {
//     console.error("Subscription cancellation error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// // ==================== FLOW-B: Customer Payment via Stripe Connect ====================
// // Customer pays Owner for room booking using Destination Charges

// const createCustomerPayment = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const {
//       bookingId,
//       propertyId,
//       amount,
//       paymentMethodId,
//       stripeConnectAccountId,
//     } = req.body;

//     const userId = req.user.user.userid;

//     // Validate required fields
//     if (!bookingId || !propertyId || !amount || !paymentMethodId) {
//       return res.status(400).json({
//         error: "Missing required fields: bookingId, propertyId, amount, paymentMethodId",
//       });
//     }

//     // Verify booking exists and belongs to user
//     const booking = await prisma.booking.findUnique({
//       where: { bookingid: bookingId },
//       include: { property: true },
//     });

//     if (!booking || booking.userid !== userId) {
//       return res.status(404).json({ error: "Booking not found or unauthorized" });
//     }

//     if (booking.propertyid !== propertyId) {
//       return res.status(400).json({ error: "Property ID does not match booking" });
//     }

//     // Verify property owner has Stripe Connect account
//     const property = await prisma.property.findUnique({
//       where: { propertyid: propertyId },
//       include: { User: true },
//     });

//     if (!property) {
//       return res.status(404).json({ error: "Property not found" });
//     }

//     if (!stripeConnectAccountId) {
//       return res.status(400).json({
//         error: "Property owner has not set up Stripe Connect account",
//       });
//     }

//     // Convert amount to cents
//     const amountInCents = Math.round(amount * 100);

//     // Create payment intent with destination charge
//     const paymentIntent = await stripe.paymentIntents.create(
//       {
//         amount: amountInCents,
//         currency: "cad",
//         payment_method: paymentMethodId,
//         confirm: true,
//         off_session: true,
//         application_fee_amount: Math.round(amountInCents * 0.029 + 30), // 2.9% + $0.30 Stripe fee
//         transfer_data: {
//           destination: stripeConnectAccountId,
//         },
//         metadata: {
//           bookingId: bookingId,
//           propertyId: propertyId,
//           userId: userId,
//           ownerId: property.userid,
//         },
//       },
//       {
//         stripeAccount: SUPER_ADMIN_STRIPE_ACCOUNT,
//       }
//     );

//     // Save payment record in database
//     const payment = await prisma.payment.create({
//       data: {
//         bookingid: bookingId,
//         amount: amount,
//         currency: "CAD",
//         stripe_payment_intent_id: paymentIntent.id,
//         stripe_charge_id: paymentIntent.charges?.data?.[0]?.id || null,
//         payment_status: paymentIntent.status === "succeeded" ? "PAID" : "PENDING",
//         paid_at: paymentIntent.status === "succeeded" ? new Date() : null,
//         created_at: new Date(),
//       },
//     });

//     // Update booking status if payment succeeded
//     if (paymentIntent.status === "succeeded") {
//       await prisma.booking.update({
//         where: { bookingid: bookingId },
//         data: { booking_status: "CONFIRMED" },
//       });
//     }

//     res.status(201).json({
//       success: true,
//       message: "Payment processed successfully",
//       payment: {
//         paymentId: payment.paymentid,
//         bookingId: bookingId,
//         amount: amount,
//         currency: "CAD",
//         status: payment.payment_status,
//         paidAt: payment.paid_at,
//       },
//     });
//   } catch (error) {
//     console.error("Payment processing error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// const getPaymentStatus = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "User is not authenticated" });
//     }

//     const { paymentId } = req.params;

//     const payment = await prisma.payment.findUnique({
//       where: { paymentid: paymentId },
//       include: {
//         booking: {
//           include: { User: true, property: true },
//         },
//       },
//     });

//     if (!payment) {
//       return res.status(404).json({ error: "Payment not found" });
//     }

//     // Verify user owns this payment
//     if (payment.booking.User.userid !== req.user.user.userid) {
//       return res.status(403).json({ error: "Unauthorized access to payment" });
//     }

//     res.json({
//       success: true,
//       payment: {
//         paymentId: payment.paymentid,
//         amount: payment.amount,
//         currency: payment.currency,
//         status: payment.payment_status,
//         paidAt: payment.paid_at,
//         createdAt: payment.created_at,
//         booking: {
//           bookingId: payment.booking.bookingid,
//           propertyId: payment.booking.propertyid,
//           checkInDate: payment.booking.checkin_date,
//           checkOutDate: payment.booking.checkout_date,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Get payment status error:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };

// export {
//   createOwnerSubscription,
//   cancelOwnerSubscription,
//   createCustomerPayment,
//   getPaymentStatus,
// };



import Stripe from "stripe";
import prisma from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPER_ADMIN_STRIPE_ACCOUNT = process.env.SUPER_ADMIN_STRIPE_ACCOUNT;

// ==================== FLOW-A: Owner Subscription Payment ====================
// Owner pays CAD 10/month for property listing using Stripe Subscriptions

const createOwnerSubscription = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const { paymentMethodId } = req.body;
    const userId = req.user.user.userid;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    // Check if owner exists
    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!ownerInfo) {
      return res.status(404).json({ error: "Owner information not found" });
    }

    // Create Stripe customer for owner if not exists
    let stripeCustomerId = ownerInfo.stripe_customer_id;
    
    if (!stripeCustomerId) {
      const user = await prisma.User.findUnique({
        where: { userid: userId },
      });

      const customer = await stripe.customers.create({
        email: user.email,
        name: ownerInfo.legalfullname,
        metadata: { ownerid: ownerInfo.ownerid, userid: userId },
      });

      stripeCustomerId = customer.id;

      // Save customer ID in database
      await prisma.ownerinfo.update({
        where: { ownerid: ownerInfo.ownerid },
        data: { stripe_customer_id: stripeCustomerId },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create subscription for CAD 10/month
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Property Listing - Monthly Subscription",
              description: "Monthly subscription for property listing activation",
            },
            recurring: { interval: "month", interval_count: 1 },
            unit_amount: 1000, // CAD 10 in cents
          },
        },
      ],
      payment_settings: {
        payment_method_types: ["card"],
        default_mandate_id: paymentMethodId,
      },
    });

    // Save subscription details in database
    const subscriptionRecord = await prisma.owner_subscription.create({
      data: {
        ownerid: ownerInfo.ownerid,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        amount: 10,
        currency: "CAD",
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        created_at: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      subscription: {
        subscriptionId: subscription.id,
        status: subscription.status,
        amount: 10,
        currency: "CAD",
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error("Subscription creation error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const cancelOwnerSubscription = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const userId = req.user.user.userid;

    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!ownerInfo) {
      return res.status(404).json({ error: "Owner information not found" });
    }

    const activeSubscription = await prisma.owner_subscription.findFirst({
      where: {
        ownerid: ownerInfo.ownerid,
        status: { in: ["active", "trialing"] },
      },
    });

    if (!activeSubscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.del(
      activeSubscription.stripe_subscription_id
    );

    // Update database record
    await prisma.owner_subscription.update({
      where: { subscription_id: activeSubscription.subscription_id },
      data: { status: "canceled" },
    });

    res.json({
      success: true,
      message: "Subscription canceled successfully",
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ==================== FLOW-B: Customer Payment via Stripe Connect ====================
// Customer pays Owner for room booking using Destination Charges

const createCustomerPayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const {
      bookingId,
      propertyId,
      amount,
      paymentMethodId,
      stripeConnectAccountId,
    } = req.body;

    const userId = req.user.user.userid;

    // Validate required fields
    if (!bookingId || !propertyId || !amount || !paymentMethodId) {
      return res.status(400).json({
        error: "Missing required fields: bookingId, propertyId, amount, paymentMethodId",
      });
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { bookingid: bookingId },
      include: { property: true },
    });

    if (!booking || booking.userid !== userId) {
      return res.status(404).json({ error: "Booking not found or unauthorized" });
    }

    if (booking.propertyid !== propertyId) {
      return res.status(400).json({ error: "Property ID does not match booking" });
    }

    // Verify property owner has Stripe Connect account
    const property = await prisma.property.findUnique({
      where: { propertyid: propertyId },
      include: { User: true },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (!stripeConnectAccountId) {
      return res.status(400).json({
        error: "Property owner has not set up Stripe Connect account",
      });
    }

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);

    // Create payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: "cad",
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        application_fee_amount: Math.round(amountInCents * 0.029 + 30), // 2.9% + $0.30 Stripe fee
        transfer_data: {
          destination: stripeConnectAccountId,
        },
        metadata: {
          bookingId: bookingId,
          propertyId: propertyId,
          userId: userId,
          ownerId: property.userid,
        },
      },
      {
        stripeAccount: SUPER_ADMIN_STRIPE_ACCOUNT,
      }
    );

    // Save payment record in database
    const payment = await prisma.payment.create({
      data: {
        bookingid: bookingId,
        amount: amount,
        currency: "CAD",
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges?.data?.[0]?.id || null,
        payment_status: paymentIntent.status === "succeeded" ? "PAID" : "PENDING",
        paid_at: paymentIntent.status === "succeeded" ? new Date() : null,
        created_at: new Date(),
      },
    });

    // Update booking status if payment succeeded
    if (paymentIntent.status === "succeeded") {
      await prisma.booking.update({
        where: { bookingid: bookingId },
        data: { booking_status: "CONFIRMED" },
      });
    }

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      payment: {
        paymentId: payment.paymentid,
        bookingId: bookingId,
        amount: amount,
        currency: "CAD",
        status: payment.payment_status,
        paidAt: payment.paid_at,
      },
    });
  } catch (error) {
    console.error("Payment processing error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User is not authenticated" });
    }

    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { paymentid: paymentId },
      include: {
        booking: {
          include: { User: true, property: true },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify user owns this payment
    if (payment.booking.User.userid !== req.user.user.userid) {
      return res.status(403).json({ error: "Unauthorized access to payment" });
    }

    res.json({
      success: true,
      payment: {
        paymentId: payment.paymentid,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.payment_status,
        paidAt: payment.paid_at,
        createdAt: payment.created_at,
        booking: {
          bookingId: payment.booking.bookingid,
          propertyId: payment.booking.propertyid,
          checkInDate: payment.booking.checkin_date,
          checkOutDate: payment.booking.checkout_date,
        },
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export {
  createOwnerSubscription,
  cancelOwnerSubscription,
  createCustomerPayment,
  getPaymentStatus,
};
