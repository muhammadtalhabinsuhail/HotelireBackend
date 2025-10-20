import express from "express";
import userRoutes from "./routes/usersRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";


const app = express();
app.use(express.json());
dotenv.config();


// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "*" })); // dev: * , prod: specific URL
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(verifyAuthentication);
app.use((req, res, next) => {

  res.locals.user = req.user;
  return next();
});

// Base route
app.get("/", (req, res) => {
  res.send("API is working ✅");
});








app.use("/api/auth", authRoutes);

// Mount user routes
app.use("/api/users", userRoutes);




export default app;
