import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import { CreateUserSchema } from "../dto/SignUp.dto.js";
import jwt from "jsonwebtoken";
import { Google, generateCodeVerifier, generateState } from "arctic";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendMail.js";


// CANADA ID --> 39
// jwt token expires in 1day

dotenv.config();

const OAUTH_EXCHANGE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const emailCodeStore = new Map();



const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const existingUser = await prisma.User.findUnique({ where: { email } });

    if (existingUser) {
      // user already exists → show password modal
      return res.status(200).json({
        exists: true,
        nextStep: "password", // <--- frontend will open password modal
        message: "Email already registered. Please enter your password."
      });
    }

    // otherwise, generate 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    emailCodeStore.set(email, {
      code,
      expires: Date.now() + 5 * 60 * 1000 // expires in 5 min
    });

    await sendEmail(email, code);

    res.status(200).json({
      exists: false,
      nextStep: "verifyCode", // <--- frontend will open code modal
      message: "Verification code sent to your email."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};





// email next time dubara user nhi daaala ga balka nextjs frontend ma sessionStorage ma save kra ga

const verifyCode = async (req, res) => {
  try {

    //code string ma bhejna h

    const { email, code } = req.body;
    const record = emailCodeStore.get(email);

    if (!record) return res.status(400).json({ message: "No code found or expired" });

    if (record.code !== code) {
      return res.status(401).json({ message: "Invalid verification code" });
    }

    if (Date.now() > record.expires) {
      emailCodeStore.delete(email);
      return res.status(400).json({ message: "Code expired" });
    }

    // mark verified temporarily
    record.verified = true;
    emailCodeStore.set(email, record);

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






const getCanadianProvinces = async (req, res) => {

  try {
    const provinces = await prisma.canadian_states.findMany();

    if (provinces.length === 0) {
      return res.status(404).json({ message: "No provinces found for this country" });
    }

    return res.status(200).json({
      message: "Provinces found successfully",
      provinces,
    });

  } catch (ex) {
    return res.status(500).json({ message: "Internal Server Error", error: ex.message });
  }
};




const getCanadianCities = async (req, res) => {
  const { id } = req.params;

  try {
    const cities = await prisma.canadian_cities.findMany({
      where: { canadian_province_id: Number(id) }, // make sure id is numeric
    });

    if (cities.length === 0) {
      return res.status(404).json({ message: "No Cities found for this country" });
    }

    return res.status(200).json({
      message: "Cities found successfully",
      cities,
    });

  } catch (ex) {
    return res.status(500).json({ message: "Internal Server Error", error: ex.message });
  }
};





// email next time dubara user nhi daaala ga balka nextjs frontend ma sessionStorage ma save kra ga

const signUp = async (req, res) => {

  try {


    const data = {
      roleid: req.body.roleid || 3, // default role is 3
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      passwordhash: req.body.passwordhash, // hash before saving!
      address: req.body.address,
      postalcode: req.body.postalcode,
      phoneno: req.body.phoneno,
      profilepic: req.body.profilepic || null,
      isemailverified: req.body.isemailverified, // default false until verified

      // Canadian user fields
      canadian_provinceid: req.body.canadian_provinceid,
      canadian_cityid: req.body.canadian_cityid,

      // International user fields
      international_country: req.body.international_country,
      international_province: req.body.international_province,
      international_city: req.body.international_city,
    };


    const isUserExist = await prisma.User.findUnique(
      {
        where: { email: data.email }
      }
    );



    if (isUserExist) {
      return res.status(400).json({ message: "User with this email already exisits" });
    }


    const record = emailCodeStore.get(data.email);
    if (!record || !record.verified) {
      return res.status(401).json({ message: "Email not verified yet" });
    }


    data.isemailverified = true;

    const hashedPassword = await bcrypt.hash(data.passwordhash, 10);
    data.passwordhash = hashedPassword;

    const user = await prisma.User.create({ data });

    const { passwordhash, ...userWithoutPassword } = user;

    // ✅ auto login: create JWT and cookie
    const token = jwt.sign(
      { user: userWithoutPassword },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

   

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
 // 1 hour
    });



    // ✅ clear verified email code
    emailCodeStore.delete(data.email);

    return res.status(201).json({
      message: "User created successfully",
      data: user,
    });
  } catch (ex) {
    return res.status(500).json({ ex: error.message });
  }

}








// email next time dubara user nhi daaala ga balka nextjs frontend ma sessionStorage ma save kra ga
const login = async (req, res) => {
  const data = {
    email: req.body.email,
    passwordhash: req.body.passwordhash
  }

  const isUserExist = await prisma.User.findUnique(
    {
      where: { email: data.email }
    }
  );

  if (!isUserExist) {
    return res.status(400).json({ message: "User not found with such Email. Please sign up" });
  }

  if (isUserExist) {

    const checkPassword = await bcrypt.compare(data.passwordhash, isUserExist.passwordhash); // true/false

    if (checkPassword) {

      const { passwordhash, ...userWithoutPassword } = isUserExist;

      const token = await jwt.sign({ user: userWithoutPassword }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24, // 1 day
// 1 hour
      });

      // delete from temporary store
      emailCodeStore.delete(data.email);

      res.status(200).json({ message: "Login successful", user: isUserExist, token: token });
    } else {
      res.status(401).json({ message: "Invalid Credentials" });
    }
  }
}






//http://localhost:3000/api/auth/google      is url se continue wala page khula ga


const getGoogleLoginPage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OAUTH_EXCHANGE_EXPIRY,
  };

  // Save OAuth state + verifier securely in cookies
  res.cookie("google_oauth_state", state, cookieConfig);
  res.cookie("google_code_verifier", codeVerifier, cookieConfig);
  res.redirect(url.toString());
};



const handleGoogleCallback = async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies.google_oauth_state;
  const codeVerifier = req.cookies.google_code_verifier;

  if (!code || !state || !savedState || !codeVerifier) {
    return res.status(400).send("Missing or invalid OAuth data.");
  }

  // Verify CSRF protection
  if (state !== savedState) {
    return res.status(403).send("Invalid OAuth state.");
  }

  try {
    // Exchange code for tokens
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    const accessToken = tokens.data.access_token;

    if (!accessToken || typeof accessToken !== "string") {
      console.error("❌ Invalid access token:", tokens);
      return res.status(500).send("Invalid access token from Google.");
    }

    // Get user profile from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.data.access_token}`
      },
    });
    const profile = await profileRes.json();

    //YAHAN LOGIC KA HISAB SE CODE LIKHO GA

    // Save user if new
    // let user = findUser(profile.id);
    // if (!user) {
    //   user = {
    //     googleId: profile.id,
    //     name: profile.name,
    //     email: profile.email,
    //     picture: profile.picture,
    //   };
    //   saveUser(user);
    // }

    // Clear cookies (security cleanup)
    res.clearCookie("google_oauth_state");
    res.clearCookie("google_code_verifier");

    res.send(`
      <h1>✅ Welcome, ${profile.name}</h1>
      <img src="${profile.picture}" width="100" />
      <p>Email: ${profile.email}</p>
      <p>Google ID: ${profile.id}</p>
      <a href="/">Back to Home</a>
    `);
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("Failed to complete Google OAuth.");
  }
};





const me = (req, res) => {
  res.json({ user: req.user });
};











//  "/api/logout"

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false

  });
  res.json({ message: "Logged out" });
};




//ONLY FOR EXPLAINING PROTECTED ROUTE AUTHENTICATED ROUTE AND BELOW AUTHORIZED ROUTE
// app.get("/api/profile", verifyAuthentication, (req, res) => {
//   res.json({
//     message: "Access granted",
//     user: req.user
//   });
// });

// app.get("/api/admin/dashboard", verifyAuthentication, requireRole([1]), (req, res) => {
//   res.json({ message: "Welcome Admin!" });
// });


export { checkEmail, verifyCode, signUp, login, getCanadianProvinces, getCanadianCities, getGoogleLoginPage, handleGoogleCallback, me, logout } 
