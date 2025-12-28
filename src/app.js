import express from "express";
import userRoutes from "./routes/usersRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import ownerPropertyRoutes from "./routes/ownerPropertyRoutes.js";
import bookingpayment from "./routes/bookingpayment.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import ownerBooking from "./routes/ownerBookingRoutes.js";
import stripePaymentRoutes from "./routes/stripePaymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import payoutRoutes from "./routes/payoutRoutes.js";
import OwnerStripeStatus from "./routes/OwnerStripeStatus.js";
const app = express();
app.set("trust proxy", 1);
dotenv.config();




// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://localhost:5000",
//   credentials: true,
// }));

app.use(cors({
  origin: [
    "https://hotelire.ca",
    "http://localhost:5000"
  ],
  credentials: true,
  origin: true, exposedHeaders: ["Set-Cookie"]
}));

app.use(cookieParser());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

// Base route
app.get("/", (req, res) => {
  res.send("API is working ✅");
});



app.use("/api/auth", authRoutes);
// app.use(verifyAuthentication);

app.use("/api/stripe",verifyAuthentication, bookingpayment);

app.use("/api/booking",verifyAuthentication, bookingRoutes);


// Owner Booking ko details show krna ka lia
 app.use("/api/owner/bookings", verifyAuthentication,ownerBooking);


 app.use("/api/stripe", verifyAuthentication, stripePaymentRoutes);
 app.use("/api/payout", verifyAuthentication, payoutRoutes);


app.use("/api/admin", verifyAuthentication, adminRoutes);




app.use("/api/ownerstripestatus", verifyAuthentication,OwnerStripeStatus );
// Protect only required routes
app.use("/api/users", verifyAuthentication, userRoutes);
app.use("/api/owner", verifyAuthentication, ownerRoutes);
app.use("/api/ownerProperty", verifyAuthentication, ownerPropertyRoutes);

export default app;
