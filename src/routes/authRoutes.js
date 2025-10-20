import express from "express";
import { getGoogleLoginPage, handleGoogleCallback, checkEmail } from "../Controller/authController.js";
import { verifyAuthentication } from "../middlewares/authMiddleware.js";


const router = express.Router();

router.get("/", (req, res) => res.send("Hello"));
router.get("/checkEmail",checkEmail)
router.get("/google", getGoogleLoginPage);
router.get("/google/callback", handleGoogleCallback);
// router.get("/profile", verifyAuthentication, getProfile);

export default router;