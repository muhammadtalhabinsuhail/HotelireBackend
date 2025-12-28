import express from "express";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";
import { getPayoutDetails, connectStripeAccount } from "../Controller/payoutController.js";

const router = express.Router();

// router.post("/details", verifyAuthentication, savePayoutDetails);
// router.get("/details", verifyAuthentication, getPayoutDetails);


router.post("/connect", connectStripeAccount);
router.get("/details", getPayoutDetails);



export default router;
