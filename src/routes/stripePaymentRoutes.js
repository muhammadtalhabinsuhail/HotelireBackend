import express from "express";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import {
  createOwnerSubscription,
  cancelOwnerSubscription,
  createCustomerPayment,
  getPaymentStatus,
    handleSubscriptionPaymentFailure,
  getSubscriptionStatus,
  getSubscriptionClientSecret,
  getOwnerSubscriptionDetails,
  checkOwnerSubscription

} from "../Controller/stripePaymentController.js";

const router = express.Router();

// FLOW-A: Owner Subscription Routes
router.post(
  "/create-subscription",
  verifyAuthentication,
  createOwnerSubscription
);
router.post(
  "/subscription/cancel",
  verifyAuthentication,
  cancelOwnerSubscription
);

// FLOW-B: Customer Payment Routes
router.post(
  "/booking-payment",
  verifyAuthentication,
  createCustomerPayment
);
router.get("/payment-status/:paymentId", verifyAuthentication, getPaymentStatus);

router.get("/getSubscriptionClientSecret/:subscriptionId", verifyAuthentication, getSubscriptionClientSecret);

router.get("/subscription/details", getOwnerSubscriptionDetails);


router.get("/subscription/check-subscription", verifyAuthentication,checkOwnerSubscription);



router.get("/subscription-status", verifyAuthentication, getSubscriptionStatus);
router.post("/webhook/subscription-failure", handleSubscriptionPaymentFailure);

















export default router;
