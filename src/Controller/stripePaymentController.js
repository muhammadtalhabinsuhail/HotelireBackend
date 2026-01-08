import Stripe from "stripe";
import prisma from "../config/prisma.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const SUPER_ADMIN_STRIPE_ACCOUNT = process.env.SUPER_ADMIN_STRIPE_ACCOUNT;

const createOwnerSubscription = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { paymentMethodId } = req.body;
    const userId = req.user.user.userid;

    const ownerInfo = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!ownerInfo) return res.status(404).json({ error: "Owner not found" });

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method missing" })
    }


    const idempotencyKey =
      req.headers["x-idempotency-key"] || `sub-${userId}-${Date.now()}`;


    let stripeCustomerId = ownerInfo.stripe_customer_id;

    let customer = null;

    if (stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId);

        // Deleted or invalid
        if (!customer || customer.deleted) {
          stripeCustomerId = null;
        }

      } catch (err) {
        // Customer ID invalid / wrong account
        stripeCustomerId = null;
      }
    }



    if (!stripeCustomerId) {
      const user = await prisma.User.findUnique({ where: { userid: userId } });

      const customer = await stripe.customers.create({
        email: user.email,
        name: ownerInfo.legalfullname,
        metadata: {
          userId: String(userId),
          ownerId: String(ownerInfo.ownerid),
        },
      });

      stripeCustomerId = customer.id;

      await prisma.ownerinfo.update({
        where: { ownerid: ownerInfo.ownerid },
        data: { stripe_customer_id: stripeCustomerId },
      });
    }

    // attach card
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    },
      { idempotencyKey: `pm-attach-${paymentMethodId}-${userId}` });
    // ignore "already attached"


    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{
        price: process.env.STRIPE_OWNER_SUBSCRIPTION_PRICE_ID,
      }],
      default_payment_method: paymentMethodId,   // 🔥 IMPORTANT
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],

    },
      {
        idempotencyKey: `sub-create-${userId}-${Date.now()}`
      });



    await prisma.ownerinfo.update({
      where: { ownerid: ownerInfo.ownerid },
      data: {
        subscription_id: subscription.id,
      },
    });


    let invoice = subscription.latest_invoice;

    // 1) ensure full invoice object
    if (typeof invoice === "string") {
      invoice = await stripe.invoices.retrieve(invoice, {
        expand: ["payment_intent"],
      });
    }

    // 2) attach PM to invoice
    await stripe.invoices.update(invoice.id, {
      default_payment_method: paymentMethodId,
    });

    if (invoice.status === "paid") {
      return res.json({
        success: true,
        subscriptionId: subscription.id,
        status: "active",
        message: "Invoice already paid",
      });
    }


    // 3) finalize only if draft
   if (!invoice.payment_intent) {
      const paid = await stripe.invoices.pay(invoice.id, {
        payment_method: paymentMethodId,
        expand: ["payment_intent"],
      });

      invoice = paid;
    }

    // 4) get PI now
    let paymentIntent = invoice.payment_intent;

    // 5) fallback — create if still missing
    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer: subscription.customer,
        payment_method: paymentMethodId,
        confirm: true,

        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      },
        {
          idempotencyKey: `pi-${subscription.id}-${Date.now()}`
        });
    }

    // 6) GUARANTEED SAFE HERE
    const clientSecret = paymentIntent.client_secret;



    return res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret,
    });
  } catch (e) {
    console.error("Subscription creation error:", e);
    res.status(500).json({ error: e.message });
  }
};



const getSubscriptionClientSecret = async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["latest_invoice.payment_intent"],
  });

  const invoice = subscription.latest_invoice;
  const intent = invoice.payment_intent;

  if (!intent?.client_secret) {
    return res
      .status(400)
      .json({ error: "PaymentIntent not yet created for this subscription" });
  }

  res.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    status: intent.status,
  });
};

const getOwnerSubscriptionDetails = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.user.userid;

    const owner = await prisma.ownerinfo.findUnique({
      where: { userid: userId },
    });

    if (!owner || !owner.subscription_id) {
      return res.status(404).json({ message: "No subscription found" });
    }

    // Get subscription
    const subscription = await stripe.subscriptions.retrieve(
      owner.subscription_id,
      {
        expand: ["items", "latest_invoice"],
      }
    );

    // Get ALL invoices for history
    const invoices = await stripe.invoices.list({
      subscription: owner.subscription_id,
      limit: 100,
    });

    let totalPaid = 0;
    let paidMonths = 0;

    const invoiceHistory = invoices.data.map((inv) => {
      const isPaid = inv.status === "paid";

      if (isPaid) {
        totalPaid += inv.amount_paid / 100;
        paidMonths += 1;
      }

      return {
        invoiceId: inv.id,
        amount: inv.amount_due / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        paid: isPaid,

        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,

        createdAt: inv.created ? inv.created * 1000 : null,
        periodStart: inv.period_start ? inv.period_start * 1000 : null,
        periodEnd: inv.period_end ? inv.period_end * 1000 : null,
      };
    });

    let nextBillingDate = null;

    /**
     * 1️⃣ Preferred (most accurate when active)
     */
    if (subscription.current_period_end) {
      nextBillingDate = subscription.current_period_end * 1000;
    }

    /**
     * 2️⃣ Retry date when past_due / unpaid
     */
    if (!nextBillingDate && subscription.latest_invoice?.next_payment_attempt) {
      nextBillingDate =
        subscription.latest_invoice.next_payment_attempt * 1000;
    }

    /**
     * 3️⃣ Upcoming invoice prediction fallback
     */
    if (!nextBillingDate) {
      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          subscription: owner.subscription_id,
        });

        if (upcoming?.next_payment_attempt) {
          nextBillingDate = upcoming.next_payment_attempt * 1000;
        }
      } catch (err) {
        // ignore – happens when no upcoming invoice exists
      }
    }


    return res.json({
      subscriptionId: subscription.id,
      status: subscription.status,

      pricePerMonth:
        subscription.items.data[0].price.unit_amount / 100,

      currentPeriodStart:
        subscription.current_period_start * 1000,

      currentPeriodEnd:
        subscription.current_period_end * 1000,

      nextBillingDate,

      totalPaid,
      paidMonths,
      currency: subscription.currency.toUpperCase(),

      history: invoiceHistory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch subscription full history",
      error: err.message,
    });
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

    const activeSubscription = await prisma.owner_subscriptions.findFirst({
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
    await prisma.owner_subscriptions.update({
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



















const checkOwnerSubscription = async (req, res) => {
  try {
    const userId = req.user?.user?.userid;

    if (!userId) {
      return res.json({ success: false, subscribed: false });
    }

    const owner = await prisma.ownerinfo.findFirst({
      where: { userid: userId },
      select: {
        subscription_id: true,
        subscription_status: true,
      },
    });

    if (!owner) {
      return res.json({ success: false, subscribed: false });
    }

    // ❌ No subscription
    if (!owner.subscription_id) {
      return res.json({ success: true, subscribed: false });
    }

    // ❌ Canceled subscription
    if (owner.subscription_status === "canceled") {
      return res.json({ success: true, subscribed: false });
    }

    // ✅ Active subscription exists
    return res.json({ success: true, subscribed: true });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, subscribed: false });
  }
};











// Handle Stripe webhook for subscription payment failures
const handleSubscriptionPaymentFailure = async (req, res) => {
  try {
    const event = req.body;
    const subscription = event.data.object;

    if (event.type === "invoice.payment_failed") {
      // Get subscription from database
      const dbSubscription = await prisma.owner_subscriptions.findUnique({
        where: { stripe_subscription_id: subscription.subscription },
        include: { ownerinfo: { include: { User: true } } },
      });

      if (!dbSubscription) return res.json({ received: true });

      const today = new Date();
      const failureStartDate = new Date(dbSubscription.last_payment_failed_date || today);
      const daysSinceFirstFailure = Math.floor((today - failureStartDate) / (1000 * 60 * 60 * 24));

      // Update failure tracking
      await prisma.owner_subscriptions.update({
        where: { subscription_id: dbSubscription.subscription_id },
        data: {
          last_payment_failed_date: new Date(),
          consecutive_failures: (dbSubscription.consecutive_failures || 0) + 1,
        },
      });

      const ownerEmail = dbSubscription.ownerinfo.User.email;
      const ownerName = dbSubscription.ownerinfo.legalfullname;

      // Day 1-19: Send warning email
      if (daysSinceFirstFailure < 20) {
        await sendEmail(
          ownerEmail,
          "⚠️ Payment Failed - Properties Will Be Disabled",
          `<html><body>
            <h2>Payment Failed - Action Required</h2>
            <p>Dear ${ownerName},</p>
            <p>Your monthly subscription payment of CAD $10 has failed.</p>
            <p><strong>⚠️ Warning:</strong> If payment continues to fail for 20 consecutive days, all your properties will be automatically disabled and customers won't be able to book.</p>
            <p><strong>Days Since First Failure:</strong> ${daysSinceFirstFailure}</p>
            <p>Please update your payment method immediately in your dashboard.</p>
            <p>Best regards,<br/>Hotelire Team</p>
          </body></html>`
        );
      }

      // Day 20+: Disable all properties
      if (daysSinceFirstFailure >= 20) {
        await prisma.property.updateMany({
          where: { userid: dbSubscription.ownerinfo.userid },
          data: { AvailableStatus: false },
        });

        await sendEmail(
          ownerEmail,
          "❌ Properties Disabled - Payment Overdue",
          `<html><body>
            <h2>Properties Disabled</h2>
            <p>Dear ${ownerName},</p>
            <p>Your subscription payment is 20 days overdue. <strong>All your properties have been disabled.</strong></p>
            <p>Customers can no longer book your properties until payment is resolved.</p>
            <p>Please update your payment method immediately to reactivate your properties.</p>
            <p>Best regards,<br/>Hotelire Team</p>
          </body></html>`
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Get subscription status
const getSubscriptionStatus = async (req, res) => {
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

    const subscription = await prisma.owner_subscriptions.findFirst({
      where: { ownerid: ownerInfo.ownerid },
      orderBy: { created_at: "desc" },
    });

    if (!subscription) {
      return res.json({
        success: true,
        hasSubscription: false,
        message: "No active subscription",
      });
    }

    const daysSinceFailed = subscription.last_payment_failed_date
      ? Math.floor((new Date() - new Date(subscription.last_payment_failed_date)) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      success: true,
      hasSubscription: true,
      subscription: {
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        nextBillingDate: subscription.current_period_end,
        lastPaymentFailedDate: subscription.last_payment_failed_date,
        daysSinceFailed,
        consecutiveFailures: subscription.consecutive_failures || 0,
        isWarning: daysSinceFailed !== null && daysSinceFailed < 20,
        isDisabled: daysSinceFailed !== null && daysSinceFailed >= 20,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error.message);
    res.status(500).json({ error: error.message });
  }
};













export {
  createOwnerSubscription,
  cancelOwnerSubscription,
  getOwnerSubscriptionDetails,
  createCustomerPayment,
  getPaymentStatus,
  getSubscriptionStatus,
  handleSubscriptionPaymentFailure,
  getSubscriptionClientSecret,
  checkOwnerSubscription
};
