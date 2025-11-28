import express from "express";
import userRoutes from "./routes/usersRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import ownerPropertyRoutes from "./routes/ownerPropertyRoutes.js";
const app = express();

dotenv.config();




app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5000",
  credentials: true,
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
app.use(verifyAuthentication);

// Mount user routes
app.use("/api/users", userRoutes);
app.use("/api/owner", ownerRoutes);

app.use("/api/ownerProperty", ownerPropertyRoutes);

export default app;
