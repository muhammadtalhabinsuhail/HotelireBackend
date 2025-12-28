import express from "express";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import {
  createOwnerSubscription,
  cancelOwnerSubscription,
  createCustomerPayment,
  getPaymentStatus,
} from "../Controller/stripePaymentController.js";

const router = express.Router();

// FLOW-A: Owner Subscription Routes
router.post(
  "/subscription/create",
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

export default router;
